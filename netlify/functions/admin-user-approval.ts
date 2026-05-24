import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return { statusCode: 500, body: 'Supabase environment variables are missing' };
  }

  const authHeader = event.headers.authorization || event.headers.Authorization;
  const token = authHeader?.replace('Bearer ', '');
  if (!token) {
    return { statusCode: 401, body: 'Missing auth token' };
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey);
  const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey, { auth: { persistSession: false } });
  const { data: userData, error: authError } = await authClient.auth.getUser(token);

  if (authError || !userData.user) {
    return { statusCode: 401, body: 'Invalid auth token' };
  }

  const body = event.body ? JSON.parse(event.body) : {};
  const targetUserId = body.targetUserId as string | undefined;
  const action = body.action as 'approve' | 'deny' | undefined;

  if (!targetUserId || !action || !['approve', 'deny'].includes(action)) {
    return { statusCode: 400, body: 'Invalid payload' };
  }

  const { data: adminProfile } = await serviceClient
    .from('profiles')
    .select('role, approval_status')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (!adminProfile || adminProfile.role !== 'admin' || adminProfile.approval_status !== 'approved') {
    return { statusCode: 403, body: 'Forbidden' };
  }

  const nextStatus = action === 'approve' ? 'approved' : 'denied';
  const { error: updateError } = await serviceClient
    .from('profiles')
    .update({ approval_status: nextStatus })
    .eq('id', targetUserId);

  if (updateError) {
    return { statusCode: 500, body: updateError.message };
  }

  const { error: auditError } = await serviceClient.from('admin_audit_log').insert({
    admin_user_id: userData.user.id,
    action: `user_${action}d`,
    target_user_id: targetUserId,
    metadata: { approval_status: nextStatus }
  });

  if (auditError) {
    return { statusCode: 500, body: auditError.message };
  }

  return { statusCode: 200, body: JSON.stringify({ success: true, approval_status: nextStatus }) };
};
