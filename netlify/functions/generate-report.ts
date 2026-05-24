import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { decryptGoogleMapsKey } from './_googleMapsKey';

async function resolveGoogleMapsKey(serviceClient: ReturnType<typeof createClient>, userId: string) {
  const { data } = await serviceClient.from('profiles').select('google_maps_api_key_encrypted').eq('id', userId).maybeSingle();
  const userKey = decryptGoogleMapsKey(data?.google_maps_api_key_encrypted, process.env.GOOGLE_API_KEY_ENCRYPTION_SECRET);
  return userKey || process.env.GOOGLE_MAPS_API_KEY || null;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Missing Supabase environment variables.' }) };
  }

  const authHeader = event.headers.authorization || event.headers.Authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return { statusCode: 401, body: JSON.stringify({ error: 'Missing bearer token.' }) };

  const authedClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const serviceClient = createClient(supabaseUrl, serviceKey);

  const { data: authData, error: authError } = await authedClient.auth.getUser();
  if (authError || !authData.user) return { statusCode: 401, body: JSON.stringify({ error: 'Invalid auth token.' }) };

  const body = JSON.parse(event.body ?? '{}');
  if (body.mode === 'geocode') {
    const key = await resolveGoogleMapsKey(serviceClient, authData.user.id);
    if (!key) return { statusCode: 200, body: JSON.stringify({ warning: 'Google Maps key unavailable. Skipping geocoding.' }) };
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(body.address)}&key=${encodeURIComponent(key)}`;
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
