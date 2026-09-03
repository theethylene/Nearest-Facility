'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import PostalCodeForm from '@/components/PostalCodeForm';
import ResultCard, { ChpIcon, AacIcon, type NearestPost } from '@/components/ResultCard';

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
  const hasAnyResults = hasChpResults || hasAacResults;

  // The map panel stays mounted at all times (see MapView's default
  // Singapore-centred view) rather than only appearing after a search, so
  // categories default to empty arrays until there's something to plot.
  const mapCategories = result
    ? [
        {
          key: 'chp',
          categoryLabel: 'Community Health Posts',
          primaryColor: '#1f7a4d',
          alternateColor: '#6b7280',
          shape: 'circle' as const,
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
          shape: 'diamond' as const,
          posts: result.aacResults.map((post) => ({
            id: post.id,
            name: post.name,
            distanceKm: post.distanceKm,
            lat: post.latitude,
            lng: post.longitude,
          })),
        },
      ]
    : [];

  return (
    <div className="page">
      <header className="topbar">
        <span className="topbar__mark" aria-hidden="true" />
        <div className="topbar__text">
          <p className="topbar__eyebrow">East Site</p>
          <h1 className="topbar__title">Nearest Community Health Posts and Active Ageing Centres</h1>
        </div>
      </header>

      <main className="layout">
        <div className="layout__primary">
          <p className="intro">
            Enter your 6-digit Singapore postal code to find the closest Community Health Posts and Active Ageing
            Centres.
          </p>

          {/* Idle-state content: real coverage numbers plus a short
              walkthrough, so this column carries useful information before
              a search rather than sitting mostly blank. Hidden once a
              search has produced a result. */}
          {!result && (
            <div className="stats-strip">
              <div className="stat">
                <span className="stat__value">150</span>
                <span className="stat__label">Community Health Posts</span>
              </div>
              <div className="stat">
                <span className="stat__value">39</span>
                <span className="stat__label">Active Ageing Centres</span>
              </div>
              <div className="stat">
                <span className="stat__value">Eastern</span>
                <span className="stat__label">Area covered</span>
              </div>
            </div>
          )}

          <PostalCodeForm onSearch={handleSearch} loading={loading} errorMessage={errorMessage} />

          <p className="note">
            Straight-line distance is used as a guide. Please consider factors such as actual road distance and
            real-life path barriers.
          </p>

          {!result && (
            <ol className="how-it-works">
              <li>
                <span className="how-it-works__step">1</span>
                Enter your 6-digit postal code
              </li>
              <li>
                <span className="how-it-works__step">2</span>
                We rank the nearest posts and centres by straight-line distance
              </li>
              <li>
                <span className="how-it-works__step">3</span>
                Get addresses and distances instantly, plotted on the map
              </li>
            </ol>
          )}

          {result && hasAnyResults && (
            <>
              {hasChpResults && (
                <div className="results-section results-section--chp">
                  <h2 className="section-heading">
                    <span className="section-heading__icon" aria-hidden="true">
                      <ChpIcon />
                    </span>
                    Nearest Community Health Posts
                  </h2>
                  <div className="results-list">
                    {result.results.map((post, index) => (
                      <ResultCard key={post.id} post={post} rank={index} category="chp" />
                    ))}
                  </div>
                </div>
              )}

              {hasAacResults && (
                <div className="results-section results-section--aac">
                  <h2 className="section-heading">
                    <span className="section-heading__icon" aria-hidden="true">
                      <AacIcon />
                    </span>
                    Nearest Active Ageing Centres
                  </h2>
                  <p className="section-subheading">Community programmes and support services for seniors.</p>
                  <div className="results-list">
                    {result.aacResults.map((post, index) => (
                      <ResultCard key={post.id} post={post} rank={index} category="aac" />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <aside className="layout__map-panel">
          <MapView
            userLocation={result ? { lat: result.userLocation.latitude, lng: result.userLocation.longitude } : null}
            categories={mapCategories}
          />

          {result && hasAnyResults && (
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
          )}
        </aside>
      </main>

      <footer className="disclaimer">
        <p className="disclaimer__label">Disclaimers:</p>
        <p>Correct as of Aug 2026</p>
        <p>For use by CGH HSG Team only, in the Eastern Area.</p>
      </footer>
    </div>
  );
}
