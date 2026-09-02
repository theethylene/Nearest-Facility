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

// A small numbered circle marker for each ranked result, so the map makes
// it visually obvious which pin is the nearest post vs. the alternates.
function rankIcon(rank: number) {
  const color = rank === 0 ? '#1f7a4d' : '#6b7280';
  return L.divIcon({
    className: 'rank-marker',
    html: `<span style="background:${color}">${rank + 1}</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

type LatLng = { lat: number; lng: number };

type ResultPin = {
  id: string;
  name: string;
  distanceKm: number;
  lat: number;
  lng: number;
};

type MapViewProps = {
  userLocation: LatLng;
  posts: ResultPin[];
};

function FitBounds({ userLocation, posts }: { userLocation: LatLng; posts: ResultPin[] }) {
  const map = useMap();

  useEffect(() => {
    const points: [number, number][] = [
      [userLocation.lat, userLocation.lng],
      ...posts.map((post): [number, number] => [post.lat, post.lng]),
    ];
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
  }, [map, userLocation, posts]);

  return null;
}

export default function MapView({ userLocation, posts }: MapViewProps) {
  const label =
    posts.length > 1
      ? `Map showing your location and ${posts.length} nearby Community Health Posts`
      : `Map showing your location and the route to ${posts[0]?.name ?? 'the nearest post'}`;

  return (
    <div className="map-container" role="img" aria-label={label}>
      <MapContainer
        center={[userLocation.lat, userLocation.lng]}
        zoom={15}
        scrollWheelZoom={false}
        style={{ height: '320px', width: '100%', borderRadius: '12px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
          <Popup>Your postal code</Popup>
        </Marker>
        {posts.map((post, index) => (
          <Marker key={post.id} position={[post.lat, post.lng]} icon={rankIcon(index)}>
            <Popup>
              {post.name}
              <br />
              {post.distanceKm.toFixed(2)} km away
            </Popup>
          </Marker>
        ))}
        <FitBounds userLocation={userLocation} posts={posts} />
      </MapContainer>
    </div>
  );
}
