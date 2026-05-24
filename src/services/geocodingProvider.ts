export interface GeocodeResult {
  normalizedAddress: string;
  city: string;
  county: string;
  state: string;
  zip: string;
  latitude: number;
  longitude: number;
}

function buildMockGeocode(address: string): GeocodeResult {
  const normalized = address.trim();
  const hash = [...normalized].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const latitude = 30.2 + (hash % 90) / 1000;
  const longitude = -97.9 + (hash % 120) / 1000;

  return {
    normalizedAddress: normalized,
    city: 'Austin',
    county: 'Travis',
    state: 'TX',
    zip: '78701',
    latitude: Number(latitude.toFixed(6)),
    longitude: Number(longitude.toFixed(6)),
  };
}

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const key = import.meta.env.GOOGLE_MAPS_API_KEY;

  // API key may be missing in local/demo environments. Keep report flow alive with mocks.
  if (!key) {
    return buildMockGeocode(address);
  }

  // TODO: Connect official geocoding API via serverless function when key is available.
  return buildMockGeocode(address);
}
