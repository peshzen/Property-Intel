import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Building2,
  ChartColumnBig,
  Compass,
  FilePlus2,
  FileText,
  Heart,
  Home,
  LogOut,
  Moon,
  Search,
  Settings,
  Shield,
  Sparkles,
  Sun,
  User,
} from 'lucide-react';
import { Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { db, seed, type AppAuditLog, type AppReport, type AppUser } from './lib/mockDb';
import { geocodeAddress } from './services/geocodingProvider';
import { getPropertyFacts } from './services/propertyDataProvider';
import { getComps } from './services/compsProvider';
import { scoreReport } from './services/reportScoringService';
import { getPublicRecordsChecks } from './services/publicRecordsProvider';
import { exportReportPdf } from './services/pdfService';
import { createShareToken, shareUrl } from './services/shareService';
import { SettingsPage as UserSettingsPage } from './pages/SettingsPage';
import { supabase } from './lib/supabase';
import { loadProfile } from './lib/db';

type NavItem = { label: string; to: string; icon: React.ComponentType<{ className?: string }>; admin?: boolean };
const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/', icon: Home },
  { label: 'Create Report', to: '/create', icon: FilePlus2 },
  { label: 'Reports', to: '/', icon: FileText },
  { label: 'Favorites', to: '/', icon: Heart },
  { label: 'Analytics', to: '/', icon: ChartColumnBig },
  { label: 'Profile', to: '/', icon: User },
  { label: 'Admin', to: '/admin', icon: Shield, admin: true },
  { label: 'Settings', to: '/settings', icon: Settings },
];

function Guard({ user, authLoading, children }: { user: AppUser | null; authLoading: boolean; children: React.ReactElement }) {
  if (authLoading) return <div className='p-6 text-sm text-muted'>Checking your session...</div>;
  return user ? children : <Navigate to='/login' replace />;
}
function ApprovedGuard({ user, authLoading, children }: { user: AppUser | null; authLoading: boolean; children: React.ReactElement }) {
  if (authLoading) return <div className='p-6 text-sm text-muted'>Checking your session...</div>;
  if (!user) return <Navigate to='/login' replace />;
  if (user.approvalStatus !== 'approved') return <Navigate to='/pending' replace />;
  return children;
}
function AdminGuard({ user, authLoading, children }: { user: AppUser | null; authLoading: boolean; children: React.ReactElement }) {
  if (authLoading) return <div className='p-6 text-sm text-muted'>Checking your session...</div>;
  if (!user) return <Navigate to='/login' replace />;
  if (user.role !== 'admin' || user.approvalStatus !== 'approved') return <Navigate to='/' replace />;
  return children;
}

function Shell({ user, darkMode, setDarkMode, logout, children }: { user: AppUser; darkMode: boolean; setDarkMode: (v: boolean) => void; logout: () => void; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const visible = navItems.filter((n) => (!n.admin || user.role === 'admin') && (n.to !== '/admin' || user.approvalStatus === 'approved'));
  return <div className='flex min-h-screen bg-app text-app'>
    <aside className={`hidden lg:flex flex-col border-r border-app bg-panel/90 backdrop-blur transition-all duration-300 ${collapsed ? 'w-24' : 'w-72'} p-4`}>
      <button className='btn-ghost mb-4 justify-start' onClick={() => setCollapsed(!collapsed)}>{collapsed ? 'Expand' : 'Collapse'}</button>
      <div className='mb-6 flex items-center gap-3'><div className='rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 p-2'><Building2 className='h-5 w-5 text-white' /></div>{!collapsed && <div><p className='text-sm text-muted'>Property Intel</p><h1 className='font-semibold'>Investor Pro</h1></div>}</div>
      <nav className='space-y-2'>{visible.map((item) => <Link key={item.label} to={item.to} className='nav-link'><item.icon className='h-4 w-4' />{!collapsed && item.label}</Link>)}</nav>
      <div className='mt-auto rounded-2xl border border-app bg-card p-3 text-xs text-muted'>
        <p className='font-semibold text-app'>$299 Pro Workspace</p>
        <p>AI comp reports, team workflows, and market insights.</p>
      </div>
    </aside>
    <div className='flex-1'>
      <header className='sticky top-0 z-30 border-b border-app bg-panel/90 px-4 py-3 backdrop-blur lg:px-8'>
        <div className='flex items-center gap-3'>
          <div className='input flex max-w-xl items-center gap-2'><Search className='h-4 w-4 text-muted' /><input className='w-full bg-transparent text-sm outline-none' placeholder='Quick search reports, address, county...' /></div>
          <button className='btn-ghost ml-auto'><Bell className='h-4 w-4' /></button>
          <button className='btn-ghost' onClick={() => setDarkMode(!darkMode)}>{darkMode ? <Sun className='h-4 w-4' /> : <Moon className='h-4 w-4' />}</button>
          <div className='hidden rounded-full border border-app bg-card px-3 py-2 text-sm md:block'>{user.fullName}</div>
          <button className='btn-ghost text-rose-500' onClick={logout}><LogOut className='h-4 w-4' /></button>
        </div>
      </header>
      <main className='mx-auto max-w-7xl p-4 pb-24 lg:p-8'>{children}</main>
      <div className='fixed bottom-0 left-0 right-0 z-30 border-t border-app bg-panel p-2 lg:hidden'>
        <div className='grid grid-cols-4 gap-1'>{visible.slice(0, 4).map((item) => <Link key={item.label} to={item.to} className='mobile-tab'><item.icon className='h-4 w-4' /><span>{item.label.split(' ')[0]}</span></Link>)}</div>
      </div>
    </div>
  </div>;
}

export function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  useEffect(() => {
    seed();
    const init = async () => {
      try {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        const p = await loadProfile().catch(() => null);
        if (p) {
          setUser({ id: p.id, email: p.email, password: '', fullName: p.full_name ?? p.email, role: p.role, approvalStatus: p.approval_status, createdAt: new Date().toISOString() });
          return;
        }
      }
    } catch {
      // Supabase unavailable: fall back to local mock session.
    }
      setUser(db.session());
    };
    init().finally(() => setAuthLoading(false));

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session) {
        setUser(db.session());
        setAuthLoading(false);
        return;
      }
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        const p = await loadProfile().catch(() => null);
        if (p) {
          setUser({ id: p.id, email: p.email, password: '', fullName: p.full_name ?? p.email, role: p.role, approvalStatus: p.approval_status, createdAt: new Date().toISOString() });
          setAuthLoading(false);
        }
      }
    });
    const savedTheme = localStorage.getItem('pi_theme');
    setDarkMode(savedTheme ? savedTheme === 'dark' : true);
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);
  useEffect(() => { document.documentElement.classList.toggle('dark', darkMode); localStorage.setItem('pi_theme', darkMode ? 'dark' : 'light'); }, [darkMode]);
  const logout = async () => { await supabase.auth.signOut(); db.logout(); setUser(null); };
  return <div className='min-h-screen'>{user ? <Shell user={user} darkMode={darkMode} setDarkMode={setDarkMode} logout={logout}><AppRoutes user={user} setUser={setUser} authLoading={authLoading} /></Shell> : <AppRoutes user={user} setUser={setUser} authLoading={authLoading} />}</div>;
}

function AppRoutes({ user, setUser, authLoading }: { user: AppUser | null; setUser: (u: AppUser) => void; authLoading: boolean }) {
  return <Routes><Route path='/login' element={<Login onLogin={setUser} user={user} authLoading={authLoading} />} /><Route path='/signup' element={<SignUp />} /><Route path='/pending' element={<Pending />} /><Route path='/' element={<Guard user={user} authLoading={authLoading}><Dashboard user={user!} /></Guard>} /><Route path='/create' element={<ApprovedGuard user={user} authLoading={authLoading}><Create user={user!} /></ApprovedGuard>} /><Route path='/admin' element={<AdminGuard user={user} authLoading={authLoading}><Admin user={user!} /></AdminGuard>} /><Route path='/settings' element={<Guard user={user} authLoading={authLoading}><UserSettingsPage /></Guard>} /><Route path='/reports/:id' element={<ApprovedGuard user={user} authLoading={authLoading}><ReportDetail user={user!} /></ApprovedGuard>} /><Route path='*' element={<Landing />} /></Routes>;
}


const isNetworkFetchError = (err: unknown) => {
  const message = (err as Error | undefined)?.message?.toLowerCase() ?? '';
  return message.includes('failed to fetch') || message.includes('fetch failed') || message.includes('networkerror');
};

const AuthScaffold = ({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) => <div className='relative flex min-h-screen items-center justify-center overflow-hidden bg-app p-6'><div className='absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,.25),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,.2),transparent_35%)]' /><div className='card-premium relative w-full max-w-md'><h1 className='text-2xl font-semibold'>{title}</h1><p className='mt-1 text-sm text-muted'>{subtitle}</p><div className='mt-6'>{children}</div></div></div>;
function Login({ onLogin, user, authLoading }: { onLogin: (u: AppUser) => void; user: AppUser | null; authLoading: boolean }) { const nav = useNavigate();
  useEffect(() => {
    if (!authLoading && user) nav(user.approvalStatus === 'approved' ? '/' : '/pending', { replace: true });
  }, [authLoading, user, nav]); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState('');
  const loginWithGoogle = async () => {
    setError('');
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/` },
      });
      if (oauthError) throw oauthError;
    } catch (e) {
      console.error('Google OAuth sign-in failed', e);
      setError((e as Error).message || 'Unable to continue with Google. Please try again.');
    }
  };
  return <AuthScaffold title='Welcome back' subtitle='Access your investor workspace'><div className='space-y-3'><input className='input' placeholder='Email' value={email} onChange={(e) => setEmail(e.target.value)} /><input type='password' className='input' placeholder='Password' value={password} onChange={(e) => setPassword(e.target.value)} /><button className='btn-primary w-full' onClick={async () => { try {
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) throw authError;
    const p = await loadProfile();
    if (!p) throw new Error('Profile not found.');
    const u: AppUser = { id: p.id, email: p.email, password: '', fullName: p.full_name ?? p.email, role: p.role, approvalStatus: p.approval_status, createdAt: new Date().toISOString() };
    onLogin(u);
    nav(u.approvalStatus === 'approved' ? '/' : '/pending');
  } catch (e) {
    if (isNetworkFetchError(e)) {
      try {
        const localUser = db.login(email, password);
        onLogin(localUser);
        nav(localUser.approvalStatus === 'approved' ? '/' : '/pending');
        return;
      } catch (localErr) {
        setError((localErr as Error).message);
        return;
      }
    }
    setError((e as Error).message);
  } }}>Login</button><button className='btn-ghost w-full' onClick={loginWithGoogle}>Continue with Google</button><Link className='text-sm text-brand hover:underline' to='/signup'>Create account</Link>{error && <p className='text-sm text-rose-400'>{error}</p>}</div></AuthScaffold>; }
function SignUp() { const nav = useNavigate(); const [fullName, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState('');
  return <AuthScaffold title='Create investor account' subtitle='Start analyzing opportunities faster'><div className='space-y-3'><input className='input' placeholder='Full name' value={fullName} onChange={(e) => setName(e.target.value)} /><input className='input' placeholder='Email' value={email} onChange={(e) => setEmail(e.target.value)} /><input type='password' className='input' placeholder='Password' value={password} onChange={(e) => setPassword(e.target.value)} /><button className='btn-primary w-full' onClick={async () => { try { const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } }); if (error) throw error; nav('/login'); } catch (e) { if (isNetworkFetchError(e)) { try { db.signUp(email, password, fullName); nav('/login'); return; } catch (localErr) { setError((localErr as Error).message); return; } } setError((e as Error).message); } }}>Create account</button>{error && <p className='text-sm text-rose-400'>{error}</p>}</div></AuthScaffold>; }
function Pending() { return <AuthScaffold title='Approval in progress' subtitle='Your workspace unlocks once an admin approves'><Link to='/login' className='btn-primary inline-flex'>Back to login</Link></AuthScaffold>; }
function Landing() { return <div className='min-h-screen bg-app text-app'><section className='mx-auto max-w-7xl p-6 lg:p-12'><div className='card-premium grid gap-8 lg:grid-cols-2'><div><p className='badge mb-4'>Investor-grade intelligence</p><h1 className='text-4xl font-bold leading-tight'>Analyze Properties Like a Professional Investor</h1><p className='mt-4 text-muted'>Generate AI-powered comp reports, ARV estimates, and investor insights in seconds.</p><div className='mt-6 flex gap-3'><Link to='/signup' className='btn-primary'>Start free trial</Link><Link to='/login' className='btn-ghost'>Sign in</Link></div></div><div className='rounded-3xl border border-app bg-card p-5 hover-card'><div className='space-y-3'><div className='skeleton h-16' /><div className='grid grid-cols-2 gap-3'><div className='skeleton h-24' /><div className='skeleton h-24' /></div><div className='skeleton h-28' /></div></div></div></section></div>; }

function Dashboard({ user }: { user: AppUser }) { const [q, setQ] = useState(''); const reports = useMemo(() => db.listReports(user).filter((r) => `${r.address} ${r.city}`.toLowerCase().includes(q.toLowerCase())), [user, q]);
  return <div className='space-y-6'><div className='flex flex-wrap items-center gap-3'><h1 className='text-2xl font-semibold'>Investor Dashboard</h1><input className='input ml-auto w-full max-w-sm' placeholder='Search address or city' value={q} onChange={(e) => setQ(e.target.value)} /></div><div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>{['Total Reports','Average ARV','Favorites','Top Counties'].map((k, i) => <div key={k} className='card'><p className='text-sm text-muted'>{k}</p><p className='mt-2 text-2xl font-semibold'>{i===0?reports.length:i===1?`$${Math.round((reports.reduce((a,b)=>a+b.myArv,0)/Math.max(reports.length,1))/1000)}k`:i===2?reports.filter(r=>r.starRating>=4).length:'12'}</p></div>)}</div><div className='grid gap-4 xl:grid-cols-3'>{reports.map((r) => <Link key={r.id} to={`/reports/${r.id}`} className='card hover-card'><p className='text-sm text-muted'>{r.city}, {r.state}</p><h3 className='mt-1 font-semibold'>{r.address}</h3><div className='mt-4 flex items-center justify-between text-sm'><span>ARV ${r.myArv.toLocaleString()}</span><span className='badge'>⭐ {r.starRating}</span></div></Link>)}{reports.length===0&&<div className='card xl:col-span-3'>No reports found.</div>}</div></div>; }

function Create({ user }: { user: AppUser }) { const nav = useNavigate(); const [address, setAddress] = useState(''); const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  return <div className='space-y-5'><div><p className='badge'>AI Report Generator</p><h1 className='mt-2 text-2xl font-semibold'>Create a New Investor Report</h1></div><div className='card-premium'><div className='grid gap-4 lg:grid-cols-[1.4fr_.6fr]'><div><input className='input h-14 text-lg' value={address} onChange={(e) => setAddress(e.target.value)} placeholder='Enter property address...' /><button className='btn-primary mt-3 w-full lg:w-auto' onClick={async () => { if (!address) return setError('Address is required.'); setLoading(true); setError(''); try { const geo = await geocodeAddress(address); const facts = await getPropertyFacts(address); const comps = await getComps(1); const checks = await getPublicRecordsChecks(); const score = scoreReport(facts, comps); const report = db.saveReport({ userId: user.id, address, city: geo.city, state: geo.state, county: 'Demo County', zip: geo.zip ?? '00000', estimatedArv: score.estimatedArv, upsetPrice: score.suggestedMaxOffer, myArv: score.estimatedArv, starRating: Math.max(1, Math.min(5, Math.round(score.confidence / 20))), customFields: [], details: { geo, facts, comps, checks, provider: 'mock' } }); nav(`/reports/${report.id}`); } catch (e) { setError((e as Error).message); } finally { setLoading(false); } }}>{loading ? 'Generating premium report...' : 'Generate Report'}</button>{error && <p className='mt-2 text-sm text-rose-400'>{error}</p>}</div><div className='card'><p className='text-sm text-muted'>Generation Steps</p><ol className='mt-2 space-y-2 text-sm'>{['Geocoding address','Scanning market comps','Scoring ARV & offer','Building investor summary'].map((s,idx)=><li key={s} className='flex items-center gap-2'><span className={`h-2.5 w-2.5 rounded-full ${loading && idx<3?'bg-brand animate-pulse':'bg-border'}`}/>{s}</li>)}</ol></div></div></div></div>; }

function Admin({ user }: { user: AppUser }) { const [pendingUsers, setPendingUsers] = useState(() => db.listUsers().filter((u) => u.approvalStatus === 'pending')); const reports = db.listReports(user); const auditLogs = db.listAuditLogs();
  const setApproval = (targetUser: AppUser, status: 'approved' | 'denied') => { db.updateUser({ ...targetUser, approvalStatus: status }); db.addAuditLog({ adminUserId: user.id, action: status === 'approved' ? 'user_approved' : 'user_denied', targetUserId: targetUser.id, metadata: {} }); setPendingUsers(db.listUsers().filter((u) => u.approvalStatus === 'pending')); };
  return <div className='space-y-6'><h1 className='text-2xl font-semibold'>Admin Control Center</h1><div className='card overflow-x-auto'><table className='w-full text-sm'><thead><tr className='text-left text-muted'><th className='pb-3'>User</th><th>Status</th><th>Actions</th></tr></thead><tbody>{pendingUsers.map((u) => <tr key={u.id} className='border-t border-app'><td className='py-3'>{u.fullName}<p className='text-muted'>{u.email}</p></td><td><span className='badge'>{u.approvalStatus}</span></td><td className='space-x-2'><button className='btn-primary' onClick={() => setApproval(u, 'approved')}>Approve</button><button className='btn-ghost' onClick={() => setApproval(u, 'denied')}>Deny</button></td></tr>)}</tbody></table>{pendingUsers.length===0&&<p>No pending users.</p>}</div><div className='grid gap-4 lg:grid-cols-2'><div className='card'><h2 className='font-semibold'>Report analytics</h2><p className='mt-3 text-3xl font-bold'>{reports.length}</p></div><div className='card'><h2 className='font-semibold'>Recent activity</h2>{auditLogs.slice(0,4).map((log: AppAuditLog)=><p key={log.id} className='mt-2 text-sm text-muted'>{log.action} · {new Date(log.createdAt).toLocaleDateString()}</p>)}</div></div></div>; }


function ReportDetail({ user }: { user: AppUser }) { const { id = '' } = useParams(); const nav = useNavigate(); const [report, setReport] = useState<AppReport | null>(db.getReport(id)); const [k, setK] = useState(''); const [v, setV] = useState(''); if (!report) return <p>Report not found.</p>; if (user.role !== 'admin' && report.userId !== user.id) return <p>Unauthorized.</p>;
  return <div className='space-y-5'><div className='sticky top-20 z-20 rounded-2xl border border-app bg-panel/90 p-3 backdrop-blur'><div className='flex flex-wrap items-center gap-2'><h1 className='mr-auto text-xl font-semibold'>{report.address}</h1><button className='btn-primary' onClick={() => exportReportPdf({ id: report.id, user_id: report.userId, address: report.address, city: report.city, county: report.county, state: report.state, zip: report.zip, latitude: 0, longitude: 0, main_image_url: null, property_images: [], zillow_estimate: null, realtor_estimate: null, estimated_arv: report.myArv, upset_price: report.upsetPrice, star_rating: report.starRating, report_data: report.details, custom_fields: report.customFields, share_token: null, created_at: report.createdAt })}>Download PDF</button><button className='btn-ghost' onClick={() => { const t = createShareToken(); const updated = { ...report, details: { ...report.details, shareToken: t } }; db.updateReport(updated); setReport(updated); navigator.clipboard.writeText(shareUrl(t)).catch(() => undefined); }}>Share</button></div></div><div className='grid gap-4 md:grid-cols-3'><div className='card'><p className='text-muted text-sm'>Estimated ARV</p><p className='text-2xl font-semibold'>${report.myArv.toLocaleString()}</p></div><div className='card'><p className='text-muted text-sm'>Suggested Offer</p><p className='text-2xl font-semibold'>${report.upsetPrice.toLocaleString()}</p></div><div className='card'><p className='text-muted text-sm'>Confidence</p><p className='text-2xl font-semibold'>{report.starRating * 20}%</p></div></div><div className='card'><h3 className='mb-3 font-semibold'>Custom Notes</h3>{report.customFields.map((f, i) => <p key={i}>{f.key}: {f.value}</p>)}<div className='mt-3 flex flex-wrap gap-2'><input className='input max-w-xs' placeholder='Field' value={k} onChange={(e) => setK(e.target.value)} /><input className='input max-w-xs' placeholder='Value' value={v} onChange={(e) => setV(e.target.value)} /><button className='btn-primary' onClick={() => { if (!k) return; const updated = { ...report, customFields: [...report.customFields, { key: k, value: v }] }; db.updateReport(updated); setReport(updated); setK(''); setV(''); }}>Add</button><button className='btn-ghost text-rose-400' onClick={() => { db.deleteReport(report.id, user); nav('/'); }}>Delete</button></div></div></div>; }
