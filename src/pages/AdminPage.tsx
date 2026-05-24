import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile, Report } from '../types';

interface AdminPageProps {
  profile: Profile | null;
}

interface AuditLog {
  id: string;
  action: string;
  target_user_id: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
}

export function AdminPage({ profile }: AdminPageProps) {
  const [pendingUsers, setPendingUsers] = useState<Profile[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningUserId, setActioningUserId] = useState<string | null>(null);

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    const [pendingRes, reportsRes, logsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('approval_status', 'pending').order('created_at', { ascending: true }),
      supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('admin_audit_log').select('*').order('created_at', { ascending: false }).limit(20)
    ]);

    if (pendingRes.error) console.error('Failed loading pending users', pendingRes.error);
    if (reportsRes.error) console.error('Failed loading reports', reportsRes.error);
    if (logsRes.error) console.error('Failed loading logs', logsRes.error);

    setPendingUsers((pendingRes.data as Profile[]) ?? []);
    setReports((reportsRes.data as Report[]) ?? []);
    setAuditLogs((logsRes.data as AuditLog[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const moderateUser = async (targetUserId: string, action: 'approve' | 'deny') => {
    setActioningUserId(targetUserId);
    try {
      const { data: authData } = await supabase.auth.getSession();
      const token = authData.session?.access_token;
      if (!token) throw new Error('Missing session token');

      const response = await fetch('/.netlify/functions/admin-user-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ targetUserId, action })
      });
      if (!response.ok) {
        const body = await response.text();
        throw new Error(body || 'Failed approval action');
      }
      await loadAdminData();
    } catch (error) {
      console.error(error);
      alert(`Unable to ${action} user.`);
    } finally {
      setActioningUserId(null);
    }
  };

  return (
    <div className='space-y-6'>
      <h1 className='text-xl font-semibold'>Admin Dashboard</h1>
      <p className='text-sm text-slate-600 dark:text-slate-300'>Signed in as {profile?.email}</p>

      <section className='card'>
        <h2 className='font-semibold mb-3'>Pending users</h2>
        {loading ? <p>Loading…</p> : null}
        {!loading && pendingUsers.length === 0 ? <p className='text-sm text-slate-500'>No pending users.</p> : null}
        <div className='space-y-3'>
          {pendingUsers.map((user) => (
            <div key={user.id} className='border rounded p-3 flex items-center gap-3'>
              <div className='flex-1'>
                <div className='font-medium'>{user.email}</div>
                <div className='text-xs text-slate-500'>{user.full_name || 'No name provided'}</div>
              </div>
              <button
                disabled={actioningUserId === user.id}
                className='border px-3 py-1 rounded text-green-700 border-green-600 disabled:opacity-50'
                onClick={() => moderateUser(user.id, 'approve')}
              >
                Approve
              </button>
              <button
                disabled={actioningUserId === user.id}
                className='border px-3 py-1 rounded text-red-700 border-red-600 disabled:opacity-50'
                onClick={() => moderateUser(user.id, 'deny')}
              >
                Deny
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className='card'>
        <h2 className='font-semibold mb-3'>Recent reports</h2>
        {!loading && reports.length === 0 ? <p className='text-sm text-slate-500'>No reports yet.</p> : null}
        <div className='space-y-2'>
          {reports.map((report) => (
            <div key={report.id} className='text-sm border-b pb-2'>
              {report.address} • {report.city}, {report.county} • {new Date(report.created_at).toLocaleString()}
            </div>
          ))}
        </div>
      </section>

      <section className='card'>
        <h2 className='font-semibold mb-3'>Admin audit log</h2>
        {auditLogs.length === 0 ? <p className='text-sm text-slate-500'>No audit activity yet.</p> : null}
        <div className='space-y-2'>
          {auditLogs.map((log) => (
            <div key={log.id} className='text-sm border-b pb-2'>
              <span className='font-medium'>{log.action}</span> user {log.target_user_id} at{' '}
              {new Date(log.created_at).toLocaleString()}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
