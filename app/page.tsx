'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import PostalCodeForm from '@/components/PostalCodeForm';
import ResultCard, { type NearestPost } from '@/components/ResultCard';

// Leaflet touches `window`, so the map can only render on the client.
// next/dynamic with ssr:false keeps it out of the server-rendered HTML.
const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => <div className="map-placeholder">Loading map…</div>,
});

type UserLocation = {
  postalCode: string;
  address: string;
  latitude: number;
  longitude: number;
};

type SearchResult = {
  userLocation: UserLocation;
  results: NearestPost[];
};

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<SearchResult | null>(null);

  const handleSearch = async (postalCode: string) => {
    setLoading(true);
    setErrorMessage(null);
    setResult(null);

    try {
      const response = await fetch('/api/nearest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postalCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.message ?? 'Something went wrong. Please try again.');
        return;
      }

      setResult(data as SearchResult);
    } catch {
      setErrorMessage('Something went wrong reaching the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <h1>Nearest Community Health Post</h1>
      <p className="intro">
        Enter your 6-digit Singapore postal code to find the closest Community Health Post.
      </p>

      <PostalCodeForm onSearch={handleSearch} loading={loading} errorMessage={errorMessage} />

      {result && result.results.length > 0 && (
        <>
          <div className="results-list">
            {result.results.map((post, index) => (
              <ResultCard key={post.id} post={post} rank={index} />
            ))}
          </div>
          <MapView
            userLocation={{ lat: result.userLocation.latitude, lng: result.userLocation.longitude }}
            posts={result.results.map((post) => ({
              id: post.id,
              name: post.name,
              distanceKm: post.distanceKm,
              lat: post.latitude,
              lng: post.longitude,
            }))}
          />
        </>
      )}
    </main>
  );
}
