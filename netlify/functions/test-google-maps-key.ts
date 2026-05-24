import type { Handler } from '@netlify/functions';
import { getAuthenticatedClients, mapGoogleStatusToMessage, maskGoogleMapsKey, resolveGoogleMapsKeyForUser, type KeyStatus } from './_googleMapsKey';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  try {
    const { serviceClient, userId } = await getAuthenticatedClients(event);
    const { key, hasSavedKey } = await resolveGoogleMapsKeyForUser(serviceClient, userId);
    if (!key) return { statusCode: 400, body: JSON.stringify({ ok: false, status: 'connection_failed', error: 'No Google Maps API key saved and no GOOGLE_MAPS_API_KEY fallback configured.' }) };

    const testUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent('1600 Amphitheatre Parkway, Mountain View, CA')}&key=${encodeURIComponent(key)}`;
    const response = await fetch(testUrl);
    const data = await response.json() as { status?: string; error_message?: string };
    const googleStatus = data.status ?? 'UNKNOWN_ERROR';
    const ok = response.ok && googleStatus === 'OK';
    const status: KeyStatus = ok ? 'connected' : 'connection_failed';

    await serviceClient.from('profiles').update({ google_maps_api_key_status: status, google_maps_api_key_last_tested_at: new Date().toISOString() }).eq('id', userId);

    if (ok) return { statusCode: 200, body: JSON.stringify({ ok: true, status, hasSavedKey, maskedKey: hasSavedKey ? maskGoogleMapsKey(key) : null, googleStatus }) };

    return { statusCode: 200, body: JSON.stringify({ ok: false, status, hasSavedKey, maskedKey: hasSavedKey ? maskGoogleMapsKey(key) : null, googleStatus, error: data.error_message || mapGoogleStatusToMessage(googleStatus) }) };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = message.includes('bearer token') || message.includes('auth token') ? 401 : 500;
    return { statusCode, body: JSON.stringify({ ok: false, status: 'connection_failed', error: message }) };
  }
};
