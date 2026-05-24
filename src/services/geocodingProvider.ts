import type { GeocodeResult } from '../types';

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const response = await fetch('/.netlify/functions/generate-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'geocode', address }),
  });
  if (!response.ok) throw new Error('Failed to geocode address');
  return response.json();
}
