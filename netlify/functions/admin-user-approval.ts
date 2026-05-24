import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

type ApprovalStatus = 'approved' | 'denied';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  const supabaseUrl = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey || !serviceKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Missing Supabase environment variables.' }) };
  }

  const authHeader = event.headers.authorization || event.headers.Authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return { statusCode: 401, body: JSON.stringify({ error: 'Missing bearer token.' }) };

  const authedClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const serviceClient = createClient(supabaseUrl, serviceKey);

  const { data: authData, error: authError } = await authedClient.auth.getUser();
  if (authError || !authData.user) return { statusCode: 401, body: JSON.stringify({ error: 'Invalid auth token.' }) };

  const adminUserId = authData.user.id;
  const { data: adminProfile, error: adminProfileError } = await serviceClient
    .from('profiles')
    .select('id, role, approval_status')
    .eq('id', adminUserId)
    .single();

  if (adminProfileError || !adminProfile || adminProfile.role !== 'admin' || adminProfile.approval_status !== 'approved') {
    return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden.' }) };
  }

  const payload = JSON.parse(event.body || '{}') as { userId?: string; status?: ApprovalStatus };
  if (!payload.userId || (payload.status !== 'approved' && payload.status !== 'denied')) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid body. Expected userId and status.' }) };
  }

  const { error: updateError } = await serviceClient
    .from('profiles')
    .update({ approval_status: payload.status })
    .eq('id', payload.userId);

  if (updateError) return { statusCode: 500, body: JSON.stringify({ error: updateError.message }) };

  const { error: auditError } = await serviceClient.from('admin_audit_log').insert({
    admin_user_id: adminUserId,
    action: payload.status === 'approved' ? 'user_approved' : 'user_denied',
    target_user_id: payload.userId,
    metadata: { approval_status: payload.status },
  });

  if (auditError) return { statusCode: 500, body: JSON.stringify({ error: auditError.message }) };

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
