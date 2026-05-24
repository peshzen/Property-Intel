import { useMemo, useState } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import { Bell, Building2, ChartNoAxesCombined, FileText, Heart, Menu, Search, Settings, Shield, Sparkles, UserRound } from 'lucide-react';
import { DashboardPage } from './pages/DashboardPage';
import { CreateReportPage } from './pages/CreateReportPage';
import { AdminPage } from './pages/AdminPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuthPage, LandingPage } from './pages/MarketingAndAuthPages';

const nav = [
  { to: '/', label: 'Dashboard', icon: ChartNoAxesCombined },
  { to: '/create', label: 'Create Report', icon: Sparkles },
  { to: '/reports', label: 'Reports', icon: FileText },
  { to: '/favorites', label: 'Favorites', icon: Heart },
  { to: '/analytics', label: 'Analytics', icon: Building2 },
  { to: '/profile', label: 'Profile', icon: UserRound },
  { to: '/admin', label: 'Admin', icon: Shield },
  { to: '/settings', label: 'Settings', icon: Settings }
];

const Placeholder = ({ title }: { title: string }) => <div className='card p-6'><h2>{title}</h2><p className='mt-2 text-slate-500'>Premium module coming online.</p></div>;

export function App() {
  const [dark, setDark] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  if (typeof document !== 'undefined') document.documentElement.classList.toggle('dark', dark);
  const currentLabel = useMemo(() => nav.find((n) => n.to === location.pathname)?.label ?? 'Property Intel', [location.pathname]);

  return <div className='app-shell'>
    <div className='flex min-h-screen'>
      <aside className={`glass sticky top-0 hidden h-screen flex-col p-3 md:flex ${collapsed ? 'w-20' : 'w-72'}`}>
        <button className='btn-secondary mb-5 w-full gap-2' onClick={() => setCollapsed(!collapsed)}><Menu size={16} /> {!collapsed && 'Menu'}</button>
        <div className='mb-4 px-2 font-semibold'>{collapsed ? 'PI' : 'Property Intel Pro'}</div>
        <nav className='space-y-1'>
          {nav.map(({ to, label, icon: Icon }) => <Link key={to} to={to} className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${location.pathname === to ? 'bg-slate-900 text-white dark:bg-indigo-500' : 'hover:bg-slate-200 dark:hover:bg-slate-800'}`}><Icon size={16} /> {!collapsed && label}</Link>)}
        </nav>
      </aside>
      <div className='flex-1'>
        <header className='glass sticky top-0 z-40 flex items-center gap-3 px-4 py-3 md:px-8'>
          <div className='text-sm font-semibold md:text-lg'>{currentLabel}</div>
          <div className='relative ml-auto hidden w-full max-w-md md:block'><Search className='absolute left-3 top-3' size={16} /><input className='input pl-9' placeholder='Quick search reports, addresses, counties...' /></div>
          <button className='btn-secondary'><Bell size={16} /></button>
          <button className='btn-secondary' onClick={() => setDark(!dark)}>{dark ? 'Light' : 'Dark'}</button>
          <div className='h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400' />
        </header>
        <main className='p-4 pb-24 md:p-8'><Routes>
          <Route path='/' element={<DashboardPage />} />
          <Route path='/create' element={<CreateReportPage />} />
          <Route path='/admin' element={<AdminPage />} />
          <Route path='/settings' element={<SettingsPage />} />
          <Route path='/reports' element={<Placeholder title='Reports' />} />
          <Route path='/favorites' element={<Placeholder title='Favorites' />} />
          <Route path='/analytics' element={<Placeholder title='Analytics' />} />
          <Route path='/profile' element={<Placeholder title='Profile' />} />
          <Route path='/landing' element={<LandingPage />} />
          <Route path='/login' element={<AuthPage title='Welcome back' />} />
          <Route path='/signup' element={<AuthPage title='Create your account' />} />
          <Route path='/pending' element={<AuthPage title='Pending approval' />} />
          <Route path='/forgot' element={<AuthPage title='Forgot password' />} />
        </Routes></main>
      </div>
    </div>
    <div className='glass fixed bottom-2 left-2 right-2 z-50 flex justify-around rounded-2xl p-2 md:hidden'>
      {nav.slice(0, 5).map(({ to, icon: Icon }) => <Link key={to} to={to} className={`rounded-xl p-2 ${location.pathname === to ? 'bg-slate-900 text-white dark:bg-indigo-500' : ''}`}><Icon size={18} /></Link>)}
    </div>
  </div>;
}
