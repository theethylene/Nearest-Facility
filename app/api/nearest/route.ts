import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { validatePostalCode } from '@/lib/validatePostalCode';
import { geocodePostalCode } from '@/lib/geocode';
import { haversineDistanceKm } from '@/lib/distance';
import { filterAvailablePosts, type HealthPost } from '@/lib/filterAvailablePosts';

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

  // Step 2: load Community Health Posts.
  const { data: posts, error: dbError } = await supabase
    .from('health_posts')
    .select('id, name, address, postal_code, latitude, longitude');

  if (dbError) {
    console.error('Supabase query failed:', dbError);
    return NextResponse.json(
      { error: 'data_unavailable', message: 'We could not load the health post list right now. Please try again shortly.' },
      { status: 502 }
    );
  }

  const available = filterAvailablePosts((posts ?? []) as HealthPost[]).filter(
    (post) => post.latitude != null && post.longitude != null
  );

  if (available.length === 0) {
    return NextResponse.json(
      { error: 'no_posts_available', message: 'No Community Health Posts are available right now.' },
      { status: 503 }
    );
  }

  // Step 3: rank every available post by Haversine distance and keep the
  // closest few, so the user has a fallback if the single nearest post is
  // inconvenient (e.g. across a busy road, or simply full).
  const RESULT_COUNT = 3;

  const ranked = available
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

  return NextResponse.json({
    userLocation,
    results: ranked,
  });
}
