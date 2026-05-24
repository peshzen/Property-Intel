import type { Handler } from '@netlify/functions';
import { getAuthenticatedClients, mapGoogleStatusToMessage, resolveGoogleMapsKeyForUser, tryGetAuthenticatedClients } from './_googleMapsKey';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  try {
    const auth = await tryGetAuthenticatedClients(event);
    const strictAuth = auth ?? (event.headers.authorization || event.headers.Authorization ? await getAuthenticatedClients(event) : null);
    const { serviceClient, userId } = await getAuthenticatedClients(event);
    const body = JSON.parse(event.body || '{}') as { address?: string; lat?: number; lng?: number };
    const location = body.address?.trim() || (typeof body.lat === 'number' && typeof body.lng === 'number' ? `${body.lat},${body.lng}` : null);
    if (!location) return { statusCode: 400, body: JSON.stringify({ error: 'Provide address or lat/lng.' }) };

    const key = strictAuth
      ? (await resolveGoogleMapsKeyForUser(strictAuth.serviceClient, strictAuth.userId)).key
      : (await resolveGoogleMapsKeyForUser(serviceClient, userId)).key;
    if (!key) return { statusCode: 400, body: JSON.stringify({ error: 'Missing Google Maps API key. Save one in settings or set GOOGLE_MAPS_API_KEY.' }) };

    const metadataUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?size=1200x675&location=${encodeURIComponent(location)}&key=${encodeURIComponent(key)}`;
    const metaRes = await fetch(metadataUrl);
    const meta = await metaRes.json() as { status?: string; error_message?: string };
    const googleStatus = meta.status ?? 'UNKNOWN_ERROR';
    if (!metaRes.ok || googleStatus !== 'OK') {
      return { statusCode: 400, body: JSON.stringify({ error: meta.error_message || mapGoogleStatusToMessage(googleStatus), googleStatus, imageUrl: null }) };
    }

    const imageUrl = `https://maps.googleapis.com/maps/api/streetview?size=1200x675&location=${encodeURIComponent(location)}&key=${encodeURIComponent(key)}`;
    return { statusCode: 200, body: JSON.stringify({ imageUrl, googleStatus }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error', imageUrl: null }) };
  }
};
