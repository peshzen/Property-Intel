import type { GeocodeResult, PropertyFacts } from '../types';

export async function fetchProperty(geocode: GeocodeResult): Promise<PropertyFacts> {
  const response = await fetch('/.netlify/functions/fetch-property', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ geocode }),
  });
  if (!response.ok) throw new Error('Failed to fetch property data');
  return response.json();
}
