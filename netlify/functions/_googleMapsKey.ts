import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import type { HandlerEvent } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const IV_LENGTH = 12;

type KeyStatus = 'not_connected' | 'connected' | 'connection_failed';

export function maskGoogleMapsKey(key: string): string {
  if (key.length <= 8) return `${key.slice(0, 2)}****`;
  return `${key.slice(0, 6)}${'*'.repeat(Math.max(8, key.length - 10))}${key.slice(-4)}`;
}

function deriveAesKey(secret: string): Buffer {
  return createHash('sha256').update(secret).digest();
}

export function encryptGoogleMapsKey(key: string, secret?: string): string {
  const normalized = key.trim();
  if (!normalized) throw new Error('Google Maps API key cannot be empty.');
  if (!secret) return `plain:${normalized}`;
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv('aes-256-gcm', deriveAesKey(secret), iv);
  const encrypted = Buffer.concat([cipher.update(normalized, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc:${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function decryptGoogleMapsKey(payload?: string | null, secret?: string): string | null {
  if (!payload) return null;
  if (payload.startsWith('plain:')) return payload.slice(6);
  if (!payload.startsWith('enc:') || !secret) return null;
  const [, ivB64, tagB64, dataB64] = payload.split(':');
  if (!ivB64 || !tagB64 || !dataB64) return null;
  const decipher = createDecipheriv('aes-256-gcm', deriveAesKey(secret), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]);
  return decrypted.toString('utf8');
}

export function mapGoogleStatusToMessage(status: string): string {
  const hints: Record<string, string> = {
    REQUEST_DENIED: 'Google denied the request. Check billing, enabled APIs, API restrictions, and allowed referrers/IPs.',
    OVER_QUERY_LIMIT: 'Google quota exceeded. Check daily limits and billing status.',
    INVALID_REQUEST: 'Google rejected the request as invalid. Verify request parameters and API setup.',
    ZERO_RESULTS: 'Google did not find results for the provided address/location.',
  };
  return hints[status] ?? `Google Maps request failed with status: ${status}.`;
}

export async function getAuthenticatedClients(event: HandlerEvent) {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !anonKey || !serviceKey) throw new Error('Missing Supabase environment variables.');

  const authHeader = event.headers.authorization || event.headers.Authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) throw new Error('Missing bearer token.');

  const authedClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const serviceClient = createClient(supabaseUrl, serviceKey);
  const { data: authData, error: authError } = await authedClient.auth.getUser();
  if (authError || !authData.user) throw new Error('Invalid auth token.');

  return { serviceClient, userId: authData.user.id };
}

export async function resolveGoogleMapsKeyForUser(serviceClient: ReturnType<typeof createClient>, userId: string) {
  const { data, error } = await serviceClient.from('profiles').select('google_maps_api_key_encrypted').eq('id', userId).maybeSingle();
  if (error) throw new Error(error.message);
  const userKey = decryptGoogleMapsKey(data?.google_maps_api_key_encrypted, process.env.GOOGLE_API_KEY_ENCRYPTION_SECRET);
  return { key: userKey || process.env.GOOGLE_MAPS_API_KEY || null, hasSavedKey: Boolean(userKey) };
}

export type { KeyStatus };

export function getBearerToken(event: HandlerEvent): string | null {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  return authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
}

export async function tryGetAuthenticatedClients(event: HandlerEvent) {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !anonKey || !serviceKey) throw new Error('Missing Supabase environment variables.');
  const token = getBearerToken(event);
  if (!token) return null;
  const authedClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const serviceClient = createClient(supabaseUrl, serviceKey);
  const { data: authData, error: authError } = await authedClient.auth.getUser();
  if (authError || !authData.user) return null;
  return { serviceClient, userId: authData.user.id };
}
