import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { encryptGoogleMapsKey, maskGoogleMapsKey } from './_googleMapsKey';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  const supabaseUrl = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !anonKey || !serviceKey) return { statusCode: 500, body: JSON.stringify({ error: 'Missing Supabase environment variables.' }) };

  const authHeader = event.headers.authorization || event.headers.Authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return { statusCode: 401, body: JSON.stringify({ error: 'Missing bearer token.' }) };

  const payload = JSON.parse(event.body || '{}') as { apiKey?: string };
  const apiKey = payload.apiKey?.trim();
  if (!apiKey) return { statusCode: 400, body: JSON.stringify({ error: 'API key is required.' }) };

  const authedClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const serviceClient = createClient(supabaseUrl, serviceKey);

  const { data: authData, error: authError } = await authedClient.auth.getUser();
  if (authError || !authData.user) return { statusCode: 401, body: JSON.stringify({ error: 'Invalid auth token.' }) };

  const encryptedValue = encryptGoogleMapsKey(apiKey, process.env.GOOGLE_API_KEY_ENCRYPTION_SECRET);
  const maskedKey = maskGoogleMapsKey(apiKey);

  const { error } = await serviceClient
    .from('profiles')
    .update({ google_maps_api_key_encrypted: encryptedValue, google_maps_api_key_status: 'not_connected', google_maps_api_key_last_tested_at: null })
    .eq('id', authData.user.id);

  if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  return { statusCode: 200, body: JSON.stringify({ ok: true, maskedKey, status: 'not_connected' }) };
};
