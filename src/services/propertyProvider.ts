import { authHeaders } from './_netlifyAuth';
import type { GeocodeResult, PropertyFacts } from '../types';

export async function fetchProperty(geocode: GeocodeResult): Promise<PropertyFacts> {
  const response = await fetch('/.netlify/functions/fetch-property', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify({ geocode }),
  });
  if (!response.ok) throw new Error('Failed to fetch property data');
  return response.json();
}
