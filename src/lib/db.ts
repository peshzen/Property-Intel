import { supabase } from './supabase';
import type { Comp, Profile, Report } from '../types';

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
