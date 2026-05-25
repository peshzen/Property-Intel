import { supabase } from './supabase';
import type { Comp, Profile, Report } from '../types';

export async function waitForAuthenticatedSession(attempts = 8, delayMs = 150) {
  for (let i = 0; i < attempts; i += 1) {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (data.session) return true;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return false;
}

export async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user?.id ?? null;
}

export async function loadProfile(): Promise<Profile | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function ensureProfileForCurrentUser() {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const authUser = authData.user;
  if (!authUser) return null;

  const fullName = (authUser.user_metadata?.full_name as string | undefined) ?? authUser.email ?? '';
  const { error } = await supabase.from('profiles').upsert({
    id: authUser.id,
    email: authUser.email ?? '',
    full_name: fullName,
  });
  if (error) throw error;

  return loadProfile();
}

export async function updateProfile(patch: Partial<Profile>) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');
  const { error } = await supabase.from('profiles').update(patch).eq('id', userId);
  if (error) throw error;
}

export async function createReport(report: Partial<Report>) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');
  const { data, error } = await supabase.from('reports').insert({ ...report, user_id: userId }).select('*').single();
  if (error) throw error;
  return data as Report;
}

export async function listReports() {
  const { data, error } = await supabase.from('reports').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Report[];
}

export async function listCompsForReport(reportId: string) {
  const { data, error } = await supabase.from('comps').select('*').eq('report_id', reportId);
  if (error) throw error;
  return (data ?? []) as Comp[];
}

export async function insertComps(reportId: string, comps: Comp[]) {
  if (!comps.length) return;
  const rows = comps.map((c) => ({
    report_id: reportId,
    address: c.address,
    distance_miles: c.distanceMiles,
    beds: c.beds,
    baths: c.baths,
    square_feet: c.squareFeet,
    sold_price: c.soldPrice,
    sold_date: c.soldDate,
    year_built: c.yearBuilt,
    image_url: c.imageUrl ?? null,
    source: c.source,
    adjustments: c.adjustments ?? {},
  }));
  const { error } = await supabase.from('comps').insert(rows);
  if (error) throw error;
}

export async function listProfilesForAdmin() {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function updateUserApproval(userId: string, approval_status: Profile['approval_status']) {
  const { error } = await supabase.from('profiles').update({ approval_status }).eq('id', userId);
  if (error) throw error;
}
