import type { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  const body = JSON.parse(event.body ?? '{}');
  if (body.mode === 'geocode') {
    const key = process.env.GOOGLE_MAPS_API_KEY;
    if (!key) return { statusCode: 500, body: JSON.stringify({ error: 'GOOGLE_MAPS_API_KEY missing' }) };
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(body.address)}&key=${key}`;
    const response = await fetch(url);
    const data = await response.json();
    const result = data.results?.[0];
    if (!result) return { statusCode: 404, body: JSON.stringify({ error: 'Address not found' }) };
    const comps: Record<string, string> = {};
    for (const c of result.address_components ?? []) for (const t of c.types) comps[t] = c.long_name;
    return { statusCode: 200, body: JSON.stringify({ normalizedAddress: result.formatted_address, city: comps.locality ?? '', county: comps.administrative_area_level_2 ?? '', state: comps.administrative_area_level_1 ?? '', zip: comps.postal_code ?? '', latitude: result.geometry.location.lat, longitude: result.geometry.location.lng }) };
  }
  return { statusCode: 400, body: JSON.stringify({ error: 'Invalid mode' }) };
};
