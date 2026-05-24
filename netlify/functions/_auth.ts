import { createClient } from '@supabase/supabase-js';

export type AuthContext = {
  userId: string;
  supabaseUrl: string;
  anonKey: string;
  serviceKey: string;
};

export function json(statusCode: number, payload: unknown) {
  return { statusCode, body: JSON.stringify(payload) };
}

export function parseJsonBody(eventBody: string | null, maxLength = 50_000): Record<string, unknown> {
  if (!eventBody) return {};
  if (eventBody.length > maxLength) throw new Error('Request body too large.');
  const parsed = JSON.parse(eventBody);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid JSON body.');
  return parsed as Record<string, unknown>;
}

export async function requireApprovedUser(authorizationHeader?: string | null): Promise<AuthContext> {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !anonKey || !serviceKey) throw new Error('Missing Supabase environment variables.');

  const token = authorizationHeader?.startsWith('Bearer ') ? authorizationHeader.slice(7) : null;
  if (!token) throw new Error('Missing bearer token.');

  const authedClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const serviceClient = createClient(supabaseUrl, serviceKey);

  const { data: authData, error: authError } = await authedClient.auth.getUser();
  if (authError || !authData.user) throw new Error('Invalid auth token.');

  const { data: profile, error: profileError } = await serviceClient
    .from('profiles')
    .select('id, approval_status')
    .eq('id', authData.user.id)
    .single();

  if (profileError || !profile || profile.approval_status !== 'approved') throw new Error('User is not approved.');

  return { userId: authData.user.id, supabaseUrl, anonKey, serviceKey };
}
