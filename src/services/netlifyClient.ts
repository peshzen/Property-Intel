import { supabase } from '../lib/supabase';

async function getOptionalToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function callNetlifyFunction<T>(name: string, body?: Record<string, unknown>): Promise<T> {
  const token = await getOptionalToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`/.netlify/functions/${name}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body ?? {}),
  });

  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? 'Request failed');
  return payload as T;
}

export async function callAuthedFunction<T>(name: string, body?: Record<string, unknown>): Promise<T> {
  const token = await getOptionalToken();
  if (!token) throw new Error('Not authenticated.');

  const response = await fetch(`/.netlify/functions/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body ?? {}),
  });

  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? 'Request failed');
  return payload as T;
}
