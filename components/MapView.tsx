'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { haversineDistanceKm } from '@/lib/distance';

// Leaflet's default marker icon paths break under most bundlers (including
// Next.js) because the image URLs it computes don't survive bundling.
// Pointing at the same version's CDN assets is the standard workaround.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const userIcon = new L.Icon.Default();

export type MarkerShape = 'circle' | 'diamond';

// A small numbered marker for each ranked result, so the map makes it
// visually obvious both which pin is nearest vs. an alternate, and which
// category (shape) a pin belongs to. `pixelOffset` nudges the icon a fixed
// number of screen pixels away from its true geographic point — used to
// fan out markers that would otherwise sit exactly on top of one another
// (see `layoutOverlappingMarkers` below). The offset is applied via
// iconAnchor, so it's independent of zoom level and never affects the
// marker's real position (fitBounds, popups anchored to the point, etc.
// keep using the true coordinates).
function rankIcon(
  rank: number,
  primaryColor: string,
  alternateColor: string,
  shape: MarkerShape,
  pixelOffset: { dx: number; dy: number }
) {
  const color = rank === 0 ? primaryColor : alternateColor;
  const shapeClass = shape === 'diamond' ? 'rank-marker--diamond' : 'rank-marker--circle';
  return L.divIcon({
    className: `rank-marker ${shapeClass}`,
    html: `<span style="background:${color}"><b>${rank + 1}</b></span>`,
    iconSize: [28, 28],
    // Shifting iconAnchor by (dx, dy) moves the rendered icon by (dx, dy)
    // screen pixels relative to its true lat/lng point.
    iconAnchor: [14 - pixelOffset.dx, 14 - pixelOffset.dy],
    popupAnchor: [pixelOffset.dx, -14 + pixelOffset.dy],
  });
}

type LatLng = { lat: number; lng: number };

export type ResultPin = {
  id: string;
  name: string;
  distanceKm: number;
  lat: number;
  lng: number;
};

export type MarkerCategory = {
  key: string;
  categoryLabel: string;
  primaryColor: string;
  alternateColor: string;
  shape: MarkerShape;
  posts: ResultPin[];
};

type MapViewProps = {
  userLocation: LatLng;
  categories: MarkerCategory[];
};

// Two result pins whose real-world locations are this close (in metres) are
// treated as "the same spot" for display purposes — e.g. a Community Health
// Post and an Active Ageing Centre that share one building — and get fanned
// out around their shared point rather than drawn stacked on top of each
// other.
const OVERLAP_THRESHOLD_METERS = 20;
// How far apart (in screen pixels) fanned-out markers are placed from their
// shared point. Fixed in pixels (not metres) so the separation stays
// legible at any zoom level.
const OVERLAP_SPREAD_PX = 13;

type FlatPin = { markerKey: string; lat: number; lng: number; sortOrder: number };

/**
 * Groups every result pin (across all categories) into clusters of points
 * that are within OVERLAP_THRESHOLD_METERS of each other, then assigns each
 * pin in a multi-member cluster a small screen-pixel offset arranged in a
 * circle around the shared point, so co-located CHP/AAC markers (or any
 * two results at the same address) render as distinct, adjacent icons
 * instead of one hiding the other.
 */
function layoutOverlappingMarkers(categories: MarkerCategory[]): Map<string, { dx: number; dy: number }> {
  const flat: FlatPin[] = [];
  categories.forEach((category, categoryIndex) => {
    category.posts.forEach((post, rank) => {
      flat.push({
        markerKey: `${category.key}-${post.id}`,
        lat: post.lat,
        lng: post.lng,
        sortOrder: categoryIndex * 1000 + rank,
      });
    });
  });

  type Cluster = { lat: number; lng: number; members: FlatPin[] };
  const clusters: Cluster[] = [];

  for (const pin of flat) {
    const nearby = clusters.find(
      (cluster) => haversineDistanceKm(pin.lat, pin.lng, cluster.lat, cluster.lng) * 1000 <= OVERLAP_THRESHOLD_METERS
    );
    if (nearby) {
      nearby.members.push(pin);
      // Recenter the cluster on the average of its members so the fan-out
      // is centred sensibly even if the members aren't exactly coincident.
      nearby.lat = nearby.members.reduce((sum, m) => sum + m.lat, 0) / nearby.members.length;
      nearby.lng = nearby.members.reduce((sum, m) => sum + m.lng, 0) / nearby.members.length;
    } else {
      clusters.push({ lat: pin.lat, lng: pin.lng, members: [pin] });
    }
  }

  const offsets = new Map<string, { dx: number; dy: number }>();

  for (const cluster of clusters) {
    if (cluster.members.length === 1) {
      offsets.set(cluster.members[0].markerKey, { dx: 0, dy: 0 });
      continue;
    }

    const members = [...cluster.members].sort((a, b) => a.sortOrder - b.sortOrder);
    const n = members.length;
    members.forEach((member, i) => {
      // Start from the top and go clockwise so a 2-member cluster splits
      // left/right, which reads most naturally.
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      offsets.set(member.markerKey, {
        dx: Math.round(OVERLAP_SPREAD_PX * Math.cos(angle)),
        dy: Math.round(OVERLAP_SPREAD_PX * Math.sin(angle)),
      });
    });
  }

  return offsets;
}

function FitBounds({ userLocation, categories }: { userLocation: LatLng; categories: MarkerCategory[] }) {
  const map = useMap();

  useEffect(() => {
    const points: [number, number][] = [
      [userLocation.lat, userLocation.lng],
      ...categories.flatMap((category) => category.posts.map((post): [number, number] => [post.lat, post.lng])),
    ];
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    // Re-fit whenever the set of plotted points changes; categories is a new
    // array each render, so we track it by its flattened point count/coords.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, userLocation, JSON.stringify(categories.map((c) => c.posts.map((p) => [p.lat, p.lng])))]);

  return null;
}

export default function MapView({ userLocation, categories }: MapViewProps) {
  const totalPosts = categories.reduce((sum, category) => sum + category.posts.length, 0);
  const labelParts = categories
    .filter((category) => category.posts.length > 0)
    .map((category) => `${category.posts.length} nearby ${category.categoryLabel}`);
  const label =
    totalPosts > 0
      ? `Map showing your location and ${labelParts.join(' and ')}`
      : 'Map showing your location';

  const markerOffsets = layoutOverlappingMarkers(categories);

  return (
    <div className="map-container" role="img" aria-label={label}>
      <MapContainer
        center={[userLocation.lat, userLocation.lng]}
        zoom={15}
        scrollWheelZoom={false}
        style={{ height: '360px', width: '100%', borderRadius: '12px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
          <Popup>Your postal code</Popup>
        </Marker>
        {categories.map((category) =>
          category.posts.map((post, index) => {
            const markerKey = `${category.key}-${post.id}`;
            const offset = markerOffsets.get(markerKey) ?? { dx: 0, dy: 0 };
            return (
              <Marker
                key={markerKey}
                position={[post.lat, post.lng]}
                icon={rankIcon(index, category.primaryColor, category.alternateColor, category.shape, offset)}
              >
                <Popup>
                  <strong>{category.categoryLabel}</strong>
                  <br />
                  {post.name}
                  <br />
                  {post.distanceKm.toFixed(2)} km away
                </Popup>
              </Marker>
            );
          })
        )}
        <FitBounds userLocation={userLocation} categories={categories} />
      </MapContainer>
    </div>
  );
}
