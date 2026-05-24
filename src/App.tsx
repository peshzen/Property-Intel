import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { CreateReportPage } from './pages/CreateReportPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminPage } from './pages/AdminPage';
import { SettingsPage } from './pages/SettingsPage';
import { supabase } from './lib/supabase';
import type { Profile } from './types';

function AdminRoute({ profile, loading, children }: { profile: Profile | null; loading: boolean; children: JSX.Element }) {
  const location = useLocation();

  if (loading) {
    return <div className='card'>Checking admin access…</div>;
  }

  if (!profile || profile.role !== 'admin' || profile.approval_status !== 'approved') {
    return <Navigate to='/' replace state={{ from: location.pathname }} />;
  }

  return children;
}

export function App() {
  const [dark, setDark] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      setLoadingProfile(true);
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        if (active) {
          setProfile(null);
          setLoadingProfile(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (active) {
        if (error) {
          console.error('Failed to load profile', error);
          setProfile(null);
        } else {
          setProfile((data as Profile | null) ?? null);
        }
        setLoadingProfile(false);
      }
    };

    loadProfile();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadProfile();
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <div className='min-h-screen'>
      <header className='p-4 border-b flex gap-4 items-center'>
        <b>Property Comp Analyzer</b>
        <nav className='flex gap-3 text-sm'>
          <Link to='/'>Dashboard</Link>
          <Link to='/create'>Create</Link>
          <Link to='/admin'>Admin</Link>
          <Link to='/settings'>Settings</Link>
        </nav>
        <button className='ml-auto border px-3 py-1 rounded' onClick={() => setDark(!dark)}>
          {dark ? 'Light' : 'Dark'} mode
        </button>
      </header>
      <main className='p-4'>
        <Routes>
          <Route path='/' element={<DashboardPage />} />
          <Route path='/create' element={<CreateReportPage />} />
          <Route
            path='/admin'
            element={
              <AdminRoute profile={profile} loading={loadingProfile}>
                <AdminPage profile={profile} />
              </AdminRoute>
            }
          />
          <Route path='/settings' element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  );
}
