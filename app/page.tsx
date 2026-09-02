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
  aacResults: NearestPost[];
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

  const hasChpResults = Boolean(result && result.results.length > 0);
  const hasAacResults = Boolean(result && result.aacResults.length > 0);

  return (
    <main>
      <h1>Nearest Community Health Posts and Active Ageing Centres</h1>
      <p className="intro">
        Enter your 6-digit Singapore postal code to find the closest Community Health Post and Active Ageing Centre.
      </p>

      <PostalCodeForm onSearch={handleSearch} loading={loading} errorMessage={errorMessage} />

      {result && (hasChpResults || hasAacResults) && (
        <>
          {hasChpResults && (
            <div className="results-section">
              <h2 className="section-heading">Nearest Community Health Posts</h2>
              <div className="results-list">
                {result.results.map((post, index) => (
                  <ResultCard key={post.id} post={post} rank={index} category="chp" />
                ))}
              </div>
            </div>
          )}

          {hasAacResults && (
            <div className="results-section">
              <h2 className="section-heading">Nearest Active Ageing Centres</h2>
              <p className="section-subheading">Community programmes and support services for seniors.</p>
              <div className="results-list">
                {result.aacResults.map((post, index) => (
                  <ResultCard key={post.id} post={post} rank={index} category="aac" />
                ))}
              </div>
            </div>
          )}

          <MapView
            userLocation={{ lat: result.userLocation.latitude, lng: result.userLocation.longitude }}
            categories={[
              {
                key: 'chp',
                categoryLabel: 'Community Health Posts',
                primaryColor: '#1f7a4d',
                alternateColor: '#6b7280',
                shape: 'circle',
                posts: result.results.map((post) => ({
                  id: post.id,
                  name: post.name,
                  distanceKm: post.distanceKm,
                  lat: post.latitude,
                  lng: post.longitude,
                })),
              },
              {
                key: 'aac',
                categoryLabel: 'Active Ageing Centres',
                primaryColor: '#1d5fae',
                alternateColor: '#7a8ba3',
                shape: 'diamond',
                posts: result.aacResults.map((post) => ({
                  id: post.id,
                  name: post.name,
                  distanceKm: post.distanceKm,
                  lat: post.latitude,
                  lng: post.longitude,
                })),
              },
            ]}
          />

          <div className="map-legend">
            <span className="map-legend__item">
              <span className="map-legend__swatch map-legend__swatch--circle" style={{ background: '#1f7a4d' }} />
              Community Health Post (nearest)
            </span>
            <span className="map-legend__item">
              <span className="map-legend__swatch map-legend__swatch--circle" style={{ background: '#6b7280' }} />
              Community Health Post (alternate)
            </span>
            <span className="map-legend__item">
              <span className="map-legend__swatch map-legend__swatch--diamond" style={{ background: '#1d5fae' }} />
              Active Ageing Centre (nearest)
            </span>
            <span className="map-legend__item">
              <span className="map-legend__swatch map-legend__swatch--diamond" style={{ background: '#7a8ba3' }} />
              Active Ageing Centre (alternate)
            </span>
          </div>
        </>
      )}
    </main>
  );
}
