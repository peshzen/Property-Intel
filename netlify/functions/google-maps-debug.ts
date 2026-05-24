import type { Handler } from '@netlify/functions';
import { decryptGoogleMapsKey, getAuthenticatedClients } from './_googleMapsKey';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  try {
    const { serviceClient, userId } = await getAuthenticatedClients(event);
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('role,google_maps_api_key_encrypted,google_maps_api_key_status,google_maps_api_key_last_tested_at')
      .eq('id', userId)
      .single();

    if (!profile || profile.role !== 'admin') return { statusCode: 200, body: JSON.stringify({ isAdmin: false }) };

    const userKey = decryptGoogleMapsKey(profile.google_maps_api_key_encrypted, process.env.GOOGLE_API_KEY_ENCRYPTION_SECRET);
    const geocodeTest = userKey || process.env.GOOGLE_MAPS_API_KEY ? 'ready' : 'missing_key';

    return {
      statusCode: 200,
      body: JSON.stringify({
        isAdmin: true,
        globalKeyConfigured: Boolean(process.env.GOOGLE_MAPS_API_KEY),
        savedUserKeyExists: Boolean(userKey),
        lastStatus: profile.google_maps_api_key_status,
        lastTestedAt: profile.google_maps_api_key_last_tested_at,
        geocodeTest,
        streetViewTest: geocodeTest,
      }),
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }) };
  }
};
