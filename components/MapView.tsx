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

type LatLng = { lat: number; lng: number };

type MapViewProps = {
  userLocation: LatLng;
  postLocation: LatLng;
  postName: string;
};

function FitBounds({ userLocation, postLocation }: { userLocation: LatLng; postLocation: LatLng }) {
  const map = useMap();

  useEffect(() => {
    const bounds = L.latLngBounds([
      [userLocation.lat, userLocation.lng],
      [postLocation.lat, postLocation.lng],
    ]);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
  }, [map, userLocation, postLocation]);

  return null;
}

export default function MapView({ userLocation, postLocation, postName }: MapViewProps) {
  return (
    <div className="map-container" role="img" aria-label={`Map showing your location and the route to ${postName}`}>
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
        <Marker position={[userLocation.lat, userLocation.lng]}>
          <Popup>Your postal code</Popup>
        </Marker>
        <Marker position={[postLocation.lat, postLocation.lng]}>
          <Popup>{postName}</Popup>
        </Marker>
        <FitBounds userLocation={userLocation} postLocation={postLocation} />
      </MapContainer>
    </div>
  );
}
