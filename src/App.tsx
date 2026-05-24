import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { AdminPage } from './pages/AdminPage';
import { CreateReportPage } from './pages/CreateReportPage';
import { DashboardPage } from './pages/DashboardPage';
import { SettingsPage } from './pages/SettingsPage';
import { AppProfile, fetchProfile, hasSupabaseEnv, supabase } from './lib/supabaseClient';

function SupabaseSetupError() {
  return <div className='min-h-screen flex items-center justify-center p-6'><div className='max-w-xl rounded border border-red-300 bg-red-50 p-6 text-red-900'><h1 className='text-2xl font-bold mb-2'>Supabase is not configured</h1><p>Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to your environment and restart the app.</p><p className='mt-2 text-sm'>Do not use a service role key in frontend code.</p></div></div>;
}

function PendingApprovalPage() { return <div className='card'><h1 className='text-xl font-semibold'>Pending Approval</h1><p>Your account is awaiting admin approval.</p></div>; }
function DeniedAccountPage() { return <div className='card'><h1 className='text-xl font-semibold text-red-700'>Account Denied</h1><p>Your account was denied. Contact support or an administrator.</p></div>; }

export function App() {
  const navigate = useNavigate();
  const [dark, setDark] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<AppProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const routeAfterProfile = (p: AppProfile) => {
    if (p.approval_status === 'denied') return '/denied';
    if (p.role === 'admin' && p.approval_status === 'approved') return '/admin';
    if (p.approval_status === 'approved') return '/dashboard';
    return '/pending-approval';
  };

  const loadProfileWithRetry = async (userId: string) => {
    for (let i = 0; i < 6; i += 1) {
      const p = await fetchProfile(userId);
      if (p) return p;
      await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    }
    return null;
  };

  useEffect(() => {
    if (typeof document !== 'undefined') document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    const client = supabase;

    const init = async () => {
      const { data } = await client.auth.getSession();
      const userId = data.session?.user.id ?? null;
      setSessionUserId(userId);
      if (userId) {
        const p = await loadProfileWithRetry(userId);
        setProfile(p);
        if (p) navigate(routeAfterProfile(p), { replace: true });
      }
      setLoading(false);
    };

    init();

    const { data: listener } = client.auth.onAuthStateChange(async (_event, session) => {
      const userId = session?.user.id ?? null;
      setSessionUserId(userId);
      if (!userId) {
        setProfile(null);
        navigate('/');
        return;
      }
      const p = await loadProfileWithRetry(userId);
      setProfile(p);
      if (p) navigate(routeAfterProfile(p), { replace: true });
      else navigate('/pending-approval', { replace: true });
    });

    return () => listener.subscription.unsubscribe();
  }, [navigate]);

  const isLoggedIn = useMemo(() => Boolean(sessionUserId), [sessionUserId]);

  const signIn = async () => {
    setAuthError(null);
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
  };

  const signUp = async () => {
    setAuthError(null);
    if (!supabase) return;
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setAuthError(error.message);
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  if (!hasSupabaseEnv) return <SupabaseSetupError />;
  if (loading) return <div className='p-6'>Loading...</div>;

  return <div className='min-h-screen'><header className='p-4 border-b flex gap-4 items-center'><b>Property Comp Analyzer</b><nav className='flex gap-3 text-sm'><Link to='/dashboard'>Dashboard</Link><Link to='/create'>Create</Link><Link to='/admin'>Admin</Link><Link to='/settings'>Settings</Link></nav><button className='border px-3 py-1 rounded' onClick={() => setDark(!dark)}>{dark ? 'Light' : 'Dark'} mode</button>{isLoggedIn ? <button className='border px-3 py-1 rounded' onClick={signOut}>Sign out</button> : null}</header><main className='p-4 space-y-4'>{!isLoggedIn ? <div className='card max-w-md'><h2 className='font-semibold mb-2'>Sign in / Sign up</h2><input className='w-full border p-2 rounded mb-2' value={email} placeholder='Email' onChange={(e) => setEmail(e.target.value)} /><input className='w-full border p-2 rounded mb-2' type='password' value={password} placeholder='Password' onChange={(e) => setPassword(e.target.value)} /><div className='flex gap-2'><button className='border px-3 py-1 rounded' onClick={signIn}>Sign in</button><button className='border px-3 py-1 rounded' onClick={signUp}>Sign up</button></div>{authError ? <p className='text-red-700 mt-2 text-sm'>{authError}</p> : null}</div> : null}
      <Routes>
        <Route path='/' element={<Navigate to={isLoggedIn ? (profile ? routeAfterProfile(profile) : '/pending-approval') : '/'} replace />} />
        <Route path='/pending-approval' element={<PendingApprovalPage />} />
        <Route path='/denied' element={<DeniedAccountPage />} />
        <Route path='/dashboard' element={<DashboardPage />} />
        <Route path='/create' element={<CreateReportPage />} />
        <Route path='/admin' element={<AdminPage />} />
        <Route path='/settings' element={<SettingsPage />} />
      </Routes>
    </main></div>;
}
