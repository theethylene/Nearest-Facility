'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
// category (shape) a pin belongs to.
function rankIcon(rank: number, primaryColor: string, alternateColor: string, shape: MarkerShape) {
  const color = rank === 0 ? primaryColor : alternateColor;
  const shapeClass = shape === 'diamond' ? 'rank-marker--diamond' : 'rank-marker--circle';
  return L.divIcon({
    className: `rank-marker ${shapeClass}`,
    html: `<span style="background:${color}"><b>${rank + 1}</b></span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
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
          category.posts.map((post, index) => (
            <Marker
              key={`${category.key}-${post.id}`}
              position={[post.lat, post.lng]}
              icon={rankIcon(index, category.primaryColor, category.alternateColor, category.shape)}
            >
              <Popup>
                <strong>{category.categoryLabel}</strong>
                <br />
                {post.name}
                <br />
                {post.distanceKm.toFixed(2)} km away
              </Popup>
            </Marker>
          ))
        )}
        <FitBounds userLocation={userLocation} categories={categories} />
      </MapContainer>
    </div>
  );
}
