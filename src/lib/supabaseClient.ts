import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = hasSupabaseEnv
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export type AppProfile = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  company: string | null;
  role: 'user' | 'admin';
  approval_status: 'pending' | 'approved' | 'denied';
  default_comp_radius_miles: number;
  google_maps_api_key_encrypted: string | null;
};

export type AppReport = {
  id: string;
  user_id: string;
  address: string;
  city: string | null;
  county: string | null;
  state: string | null;
  zip: string | null;
  created_at: string;
};

export type AppComp = {
  id: string;
  report_id: string;
  address: string;
  distance_miles: number | null;
  sold_price: number | null;
  sold_date: string | null;
  source: string | null;
};

export type AdminAuditLog = {
  id: string;
  admin_user_id: string;
  action: string;
  target_user_id: string | null;
  target_report_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export async function fetchProfile(userId: string): Promise<AppProfile | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id,email,full_name,phone,company,role,approval_status,default_comp_radius_miles,google_maps_api_key_encrypted')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function fetchReportsForCurrentUser(): Promise<AppReport[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('reports')
    .select('id,user_id,address,city,county,state,zip,created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchCompsForReport(reportId: string): Promise<AppComp[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('comps')
    .select('id,report_id,address,distance_miles,sold_price,sold_date,source')
    .eq('report_id', reportId);

  if (error) throw error;
  return data ?? [];
}

export async function fetchAdminAuditLog(limit = 50): Promise<AdminAuditLog[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('admin_audit_log')
    .select('id,admin_user_id,action,target_user_id,target_report_id,metadata,created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}
