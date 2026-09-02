/**
 * Geocodes a Singapore postal code to coordinates using OneMap's public
 * search endpoint. No API key/token is required for this endpoint.
 * Docs: https://www.onemap.gov.sg/apidocs/
 */
export type GeocodeResult = {
  postalCode: string;
  address: string;
  latitude: number;
  longitude: number;
};

const ONEMAP_SEARCH_URL = 'https://www.onemap.gov.sg/api/common/elastic/search';

export async function geocodePostalCode(postalCode: string): Promise<GeocodeResult | null> {
  const url = `${ONEMAP_SEARCH_URL}?searchVal=${encodeURIComponent(
    postalCode
  )}&returnGeom=Y&getAddrDetails=Y&pageNum=1`;

  const response = await fetch(url, {
    // OneMap's search results for a fixed postal code don't change; a short
    // cache keeps repeat lookups fast without going stale in any meaningful way.
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`OneMap request failed with status ${response.status}`);
  }

  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    return null;
  }

  const first = data.results[0];

  return {
    postalCode: first.POSTAL,
    address: first.ADDRESS,
    latitude: parseFloat(first.LATITUDE),
    longitude: parseFloat(first.LONGITUDE),
  };
}
