import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { validatePostalCode } from '@/lib/validatePostalCode';
import { geocodePostalCode, type GeocodeResult } from '@/lib/geocode';
import { haversineDistanceKm } from '@/lib/distance';
import { filterAvailablePosts, type HealthPost } from '@/lib/filterAvailablePosts';

const RESULT_COUNT = 3;

type RankedResult = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
};

function rankByDistance(posts: HealthPost[], userLocation: GeocodeResult): RankedResult[] {
  return posts
    .map((post) => ({
      id: post.id,
      name: post.name,
      address: post.address,
      latitude: post.latitude,
      longitude: post.longitude,
      distanceKm:
        Math.round(
          haversineDistanceKm(userLocation.latitude, userLocation.longitude, post.latitude, post.longitude) * 100
        ) / 100,
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, RESULT_COUNT);
}

export async function POST(request: NextRequest) {
  let body: { postalCode?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_request', message: 'Malformed request body.' }, { status: 400 });
  }

  const validation = validatePostalCode(body.postalCode ?? '');
  if (!validation.valid) {
    return NextResponse.json({ error: 'invalid_postal_code', message: validation.reason }, { status: 400 });
  }

  // Step 1: geocode the user's postal code.
  let userLocation;
  try {
    userLocation = await geocodePostalCode(validation.value);
  } catch (err) {
    console.error('OneMap geocoding failed:', err);
    return NextResponse.json(
      { error: 'geocode_failed', message: 'We could not look up that postal code right now. Please try again shortly.' },
      { status: 502 }
    );
  }

  if (!userLocation) {
    return NextResponse.json(
      { error: 'postal_code_not_found', message: "We couldn't find that postal code. Please double-check and try again." },
      { status: 404 }
    );
  }

  // Step 2: load Community Health Posts and Active Ageing Centres in parallel.
  const [chpResponse, aacResponse] = await Promise.all([
    supabase.from('health_posts').select('id, name, address, postal_code, latitude, longitude'),
    supabase.from('active_ageing_centres').select('id, name, address, postal_code, latitude, longitude'),
  ]);

  if (chpResponse.error) {
    console.error('Supabase health_posts query failed:', chpResponse.error);
    return NextResponse.json(
      { error: 'data_unavailable', message: 'We could not load the health post list right now. Please try again shortly.' },
      { status: 502 }
    );
  }

  if (aacResponse.error) {
    console.error('Supabase active_ageing_centres query failed:', aacResponse.error);
    return NextResponse.json(
      { error: 'data_unavailable', message: 'We could not load the active ageing centre list right now. Please try again shortly.' },
      { status: 502 }
    );
  }

  const availableChp = filterAvailablePosts((chpResponse.data ?? []) as HealthPost[]).filter(
    (post) => post.latitude != null && post.longitude != null
  );

  const availableAac = filterAvailablePosts((aacResponse.data ?? []) as HealthPost[]).filter(
    (post) => post.latitude != null && post.longitude != null
  );

  if (availableChp.length === 0 && availableAac.length === 0) {
    return NextResponse.json(
      { error: 'no_posts_available', message: 'No Community Health Posts or Active Ageing Centres are available right now.' },
      { status: 503 }
    );
  }

  // Step 3: rank each category separately by Haversine distance and keep the
  // closest few, so the user has a fallback if the single nearest post is
  // inconvenient (e.g. across a busy road, or simply full).
  const ranked = rankByDistance(availableChp, userLocation);
  const aacRanked = rankByDistance(availableAac, userLocation);

  return NextResponse.json({
    userLocation,
    results: ranked,
    aacResults: aacRanked,
  });
}
