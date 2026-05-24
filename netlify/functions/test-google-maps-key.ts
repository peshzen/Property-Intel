import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { decryptGoogleMapsKey, maskGoogleMapsKey, type KeyStatus } from './_googleMapsKey';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !anonKey || !serviceKey) return { statusCode: 500, body: JSON.stringify({ error: 'Missing Supabase environment variables.' }) };

  const authHeader = event.headers.authorization || event.headers.Authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return { statusCode: 401, body: JSON.stringify({ error: 'Missing bearer token.' }) };

  const authedClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const serviceClient = createClient(supabaseUrl, serviceKey);

  const { data: authData, error: authError } = await authedClient.auth.getUser();
  if (authError || !authData.user) return { statusCode: 401, body: JSON.stringify({ error: 'Invalid auth token.' }) };

  const { data: profile, error: profileError } = await serviceClient.from('profiles').select('google_maps_api_key_encrypted').eq('id', authData.user.id).single();
  if (profileError) return { statusCode: 500, body: JSON.stringify({ error: profileError.message }) };

  const key = decryptGoogleMapsKey(profile.google_maps_api_key_encrypted, process.env.GOOGLE_API_KEY_ENCRYPTION_SECRET);
  if (!key) return { statusCode: 400, body: JSON.stringify({ error: 'No Google Maps API key saved.' }) };

  const testUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent('1600 Amphitheatre Parkway, Mountain View, CA')}&key=${encodeURIComponent(key)}`;
  const response = await fetch(testUrl);
  const data = await response.json() as { status?: string };
  const success = response.ok && data.status === 'OK';
  const status: KeyStatus = success ? 'connected' : 'connection_failed';

  await serviceClient.from('profiles').update({ google_maps_api_key_status: status, google_maps_api_key_last_tested_at: new Date().toISOString() }).eq('id', authData.user.id);

  return { statusCode: 200, body: JSON.stringify({ ok: success, status, maskedKey: maskGoogleMapsKey(key) }) };
};
