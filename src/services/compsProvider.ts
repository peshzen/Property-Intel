import type { Comp } from '../types';
import type { GeocodeResult, PropertyFacts } from '../types';

export async function fetchComps(geocode: GeocodeResult, property: PropertyFacts, radiusMiles = 1): Promise<Comp[]> {
  const response = await fetch('/.netlify/functions/fetch-comps', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ geocode, property, radiusMiles }),
  });
  if (!response.ok) throw new Error('Failed to fetch comparable sales');
  return response.json();
}

export async function getComps(radiusMiles: number): Promise<Comp[]> {
  const response = await fetch('/.netlify/functions/fetch-comps', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ radiusMiles }),
  });
  if (!response.ok) throw new Error('Failed to fetch comparable sales');
  return response.json();
}
