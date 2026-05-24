import type { Handler } from '@netlify/functions';
import { getAuthenticatedClients, mapGoogleStatusToMessage, resolveGoogleMapsKeyForUser, tryGetAuthenticatedClients } from './_googleMapsKey';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  try {
    const auth = await tryGetAuthenticatedClients(event);
    const strictAuth = auth ?? (event.headers.authorization || event.headers.Authorization ? await getAuthenticatedClients(event) : null);
    const { address } = JSON.parse(event.body || '{}') as { address?: string };
    if (!address?.trim()) return { statusCode: 400, body: JSON.stringify({ error: 'Address is required.' }) };

    const key = strictAuth ? (await resolveGoogleMapsKeyForUser(strictAuth.serviceClient, strictAuth.userId)).key : (process.env.GOOGLE_MAPS_API_KEY || null);
    if (!key) return { statusCode: 400, body: JSON.stringify({ error: 'Missing Google Maps API key. Save one in settings or set GOOGLE_MAPS_API_KEY.' }) };

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${encodeURIComponent(key)}`;
    const response = await fetch(url);
    const data = await response.json() as any;
    const googleStatus = data.status ?? 'UNKNOWN_ERROR';
    if (!response.ok || googleStatus !== 'OK') return { statusCode: 400, body: JSON.stringify({ error: data.error_message || mapGoogleStatusToMessage(googleStatus), googleStatus }) };

    const result = data.results?.[0];
    if (!result) return { statusCode: 404, body: JSON.stringify({ error: 'No geocoding result returned.', googleStatus }) };
    const comps: Record<string, string> = {};
    for (const c of result.address_components ?? []) for (const t of c.types) comps[t] = c.long_name;

    return { statusCode: 200, body: JSON.stringify({ formatted_address: result.formatted_address, lat: result.geometry.location.lat, lng: result.geometry.location.lng, city: comps.locality ?? '', county: comps.administrative_area_level_2 ?? '', state: comps.administrative_area_level_1 ?? '', zip: comps.postal_code ?? '' }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }) };
  }
};
