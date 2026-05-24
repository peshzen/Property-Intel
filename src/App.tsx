import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { db, seed, type AppAuditLog, type AppReport, type AppUser } from './lib/mockDb';
import { geocodeAddress } from './services/geocodingProvider';
import { getPropertyFacts } from './services/propertyDataProvider';
import { getComps } from './services/compsProvider';
import { scoreReport } from './services/reportScoringService';
import { getPublicRecordsChecks } from './services/publicRecordsProvider';
import { exportReportPdf } from './services/pdfService';
import { createShareToken, shareUrl } from './services/shareService';

function Guard({ user, children }: { user: AppUser | null; children: React.ReactElement }) {
  return user ? children : <Navigate to='/login' replace />;
}
function ApprovedGuard({ user, children }: { user: AppUser | null; children: React.ReactElement }) {
  if (!user) return <Navigate to='/login' replace />;
  if (user.approvalStatus !== 'approved') return <Navigate to='/pending' replace />;
  return children;
}
function AdminGuard({ user, children }: { user: AppUser | null; children: React.ReactElement }) {
  if (!user) return <Navigate to='/login' replace />;
  if (user.role !== 'admin' || user.approvalStatus !== 'approved') return <Navigate to='/' replace />;
  return children;
}

export function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    seed();
    setUser(db.session());
    const savedTheme = localStorage.getItem('pi_theme');
    const shouldDark = savedTheme ? savedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(shouldDark);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('pi_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const logout = () => {
    db.logout();
    setUser(null);
  };

  return (
    <div className='min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100'>
      <header className='flex flex-wrap items-center gap-3 border-b p-4'>
        <b>Property Intel</b>
        {user && (
          <>
            <Link to='/'>Dashboard</Link>
            <Link to='/create'>Create Report</Link>
            {user.role === 'admin' && user.approvalStatus === 'approved' && <Link to='/admin'>Admin</Link>}
          </>
        )}
        <button className='ml-auto underline' onClick={() => setDarkMode((prev) => !prev)}>
          {darkMode ? 'Light mode' : 'Dark mode'}
        </button>
        {user && (
          <button className='underline' onClick={logout}>
            Logout
          </button>
        )}
      </header>
      <main className='p-4'>
        <Routes>
          <Route path='/login' element={<Login onLogin={setUser} />} />
          <Route path='/signup' element={<SignUp />} />
          <Route path='/pending' element={<Pending />} />
          <Route path='/' element={<Guard user={user}><Dashboard user={user!} /></Guard>} />
          <Route path='/create' element={<ApprovedGuard user={user}><Create user={user!} /></ApprovedGuard>} />
          <Route path='/admin' element={<AdminGuard user={user}><Admin user={user!} /></AdminGuard>} />
          <Route path='/reports/:id' element={<ApprovedGuard user={user}><ReportDetail user={user!} /></ApprovedGuard>} />
        </Routes>
      </main>
    </div>
  );
}

function Login({ onLogin }: { onLogin: (u: AppUser) => void }) {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  return <div className='card mx-auto max-w-md'><h1>Login</h1><input className='mt-2 w-full border p-2' placeholder='Email' value={email} onChange={(e) => setEmail(e.target.value)} /><input type='password' className='mt-2 w-full border p-2' placeholder='Password' value={password} onChange={(e) => setPassword(e.target.value)} /><button className='mt-2 rounded bg-slate-900 px-4 py-2 text-white dark:bg-slate-100 dark:text-slate-900' onClick={() => { try { const u = db.login(email, password); onLogin(u); nav(u.approvalStatus === 'approved' ? '/' : '/pending'); } catch (e) { setError((e as Error).message); } }}>Login</button><Link className='mt-2 block underline' to='/signup'>Create account</Link>{error && <p className='text-red-600'>{error}</p>}<p className='mt-2 text-xs'>Demo admin: admin@propertyintel.app / admin123</p></div>;
}
function SignUp() { const nav = useNavigate(); const [fullName, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState('');
  return <div className='card mx-auto max-w-md'><h1>Sign up</h1><input className='mt-2 w-full border p-2' placeholder='Full name' value={fullName} onChange={(e) => setName(e.target.value)} /><input className='mt-2 w-full border p-2' placeholder='Email' value={email} onChange={(e) => setEmail(e.target.value)} /><input type='password' className='mt-2 w-full border p-2' placeholder='Password' value={password} onChange={(e) => setPassword(e.target.value)} /><button className='mt-2 rounded bg-slate-900 px-4 py-2 text-white dark:bg-slate-100 dark:text-slate-900' onClick={() => { try { db.signUp(email, password, fullName); nav('/login'); } catch (e) { setError((e as Error).message); } }}>Create account</button>{error && <p className='text-red-600'>{error}</p>}</div>; }
function Pending() { return <div className='card'><h1 className='text-xl'>Pending approval</h1><p>Your account is waiting for admin approval.</p><Link to='/login' className='underline'>Back to login</Link></div>; }

function Dashboard({ user }: { user: AppUser }) {
  const [q, setQ] = useState('');
  const reports = useMemo(() => db.listReports(user).filter((r) => `${r.address} ${r.city} ${r.state}`.toLowerCase().includes(q.toLowerCase())), [user, q]);
  if (user.approvalStatus !== 'approved') return <Navigate to='/pending' replace />;

  const deleteReport = (id: string) => {
    if (!window.confirm('Delete this report? This cannot be undone.')) return;
    db.deleteReport(id, user);
    setQ((v) => v);
  };

  return <div className='space-y-3'><h1 className='text-xl'>Dashboard</h1><input className='w-full rounded border p-2' placeholder='Search reports by address/city/state' value={q} onChange={(e) => setQ(e.target.value)} />{reports.map((r) => <div key={r.id} className='card'><Link to={`/reports/${r.id}`} className='block'><b>{r.address}</b><p>{r.city}, {r.state} • ⭐ {r.starRating}</p></Link><button className='mt-2 text-sm text-red-600 underline' onClick={() => deleteReport(r.id)}>Delete report</button></div>)}{reports.length === 0 && <p>No reports found.</p>}</div>;
}

function Create({ user }: { user: AppUser }) { const nav = useNavigate(); const [address, setAddress] = useState(''); const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  return <div className='card space-y-2'><h1 className='text-xl'>Create report</h1><input className='w-full border p-2' value={address} onChange={(e) => setAddress(e.target.value)} placeholder='123 Main St, Miami, FL' /><button className='rounded bg-slate-900 px-4 py-2 text-white dark:bg-slate-100 dark:text-slate-900' onClick={async () => { if (!address) { setError('Address is required.'); return; } setLoading(true); setError(''); try { const geo = await geocodeAddress(address); const facts = await getPropertyFacts(address); const comps = await getComps(1); const checks = await getPublicRecordsChecks(); const score = scoreReport(facts, comps); const report = db.saveReport({ userId: user.id, address, city: geo.city, state: geo.state, county: 'Demo County', zip: geo.zip ?? '00000', estimatedArv: score.estimatedArv, upsetPrice: score.suggestedMaxOffer, myArv: score.estimatedArv, starRating: Math.max(1, Math.min(5, Math.round(score.confidence / 20))), customFields: [], details: { geo, facts, comps, checks, provider: 'mock' } }); nav(`/reports/${report.id}`); } catch (e) { setError((e as Error).message || 'Failed to create report.'); } finally { setLoading(false); } }}>{loading ? 'Generating...' : 'Generate + Save Report'}</button>{error && <p className='text-red-600'>{error}</p>}<p className='text-sm'>Uses demo provider data when external APIs are unavailable.</p></div>;
}

function Admin({ user }: { user: AppUser }) { const [pendingUsers, setPendingUsers] = useState(() => db.listUsers().filter((u) => u.approvalStatus === 'pending')); const reports = db.listReports(user); const auditLogs = db.listAuditLogs();
  const setApproval = (targetUser: AppUser, status: 'approved' | 'denied') => { const updatedUser = { ...targetUser, approvalStatus: status }; db.updateUser(updatedUser); db.addAuditLog({ adminUserId: user.id, action: status === 'approved' ? 'user_approved' : 'user_denied', targetUserId: targetUser.id, metadata: { targetEmail: targetUser.email, newStatus: status } }); setPendingUsers(db.listUsers().filter((u) => u.approvalStatus === 'pending')); };
  return <div className='space-y-4'><h1 className='text-xl'>Admin approvals</h1><div className='card'><h2 className='mb-2 font-semibold'>Pending Users</h2>{pendingUsers.map((u) => <div key={u.id} className='mb-2 rounded border p-2'><p>{u.fullName} ({u.email})</p><div className='space-x-2'><button className='mr-2 underline' onClick={() => setApproval(u, 'approved')}>Approve</button><button className='underline' onClick={() => setApproval(u, 'denied')}>Deny</button></div></div>)}{pendingUsers.length === 0 && <p>No pending users.</p>}</div><div className='card'><h2 className='mb-2 font-semibold'>Reports</h2>{reports.map((r) => <div key={r.id} className='mb-2 rounded border p-2'>{r.address} · {r.city}, {r.state}</div>)}{reports.length === 0 && <p>No reports yet.</p>}</div><div className='card'><h2 className='mb-2 font-semibold'>Admin Audit Log</h2>{auditLogs.map((log: AppAuditLog) => <div key={log.id} className='mb-2 rounded border p-2'><p>{new Date(log.createdAt).toLocaleString()} · {log.action}</p><p className='text-sm text-slate-600 dark:text-slate-300'>target user: {log.targetUserId ?? 'n/a'}</p></div>)}{auditLogs.length === 0 && <p>No audit records yet.</p>}</div></div>;
}

function ReportDetail({ user }: { user: AppUser }) {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const [report, setReport] = useState<AppReport | null>(db.getReport(id));
  const [k, setK] = useState('');
  const [v, setV] = useState('');

  if (!report) return <p>Report not found.</p>;
  if (user.role !== 'admin' && report.userId !== user.id) return <p>Unauthorized.</p>;

  const save = () => { db.updateReport(report); setReport({ ...report }); };
  const token = report.details?.shareToken as string | undefined;

  return <div className='space-y-2'><h1 className='text-xl'>{report.address}</h1><div className='card'><label>Star rating <input type='number' min={1} max={5} value={report.starRating} onChange={(e) => setReport({ ...report, starRating: Number(e.target.value) })} /></label><label className='ml-4'>My ARV <input type='number' value={report.myArv} onChange={(e) => setReport({ ...report, myArv: Number(e.target.value) })} /></label><label className='ml-4'>Upset price <input type='number' value={report.upsetPrice} onChange={(e) => setReport({ ...report, upsetPrice: Number(e.target.value) })} /></label><button className='ml-4 underline' onClick={save}>Save</button></div><div className='card'><h3>Custom fields</h3>{report.customFields.map((f, i) => <p key={i}>{f.key}: {f.value}</p>)}<input className='mr-2 border p-1' placeholder='Field' value={k} onChange={(e) => setK(e.target.value)} /><input className='mr-2 border p-1' placeholder='Value' value={v} onChange={(e) => setV(e.target.value)} /><button className='underline' onClick={() => { if (!k) return; setReport({ ...report, customFields: [...report.customFields, { key: k, value: v }] }); setK(''); setV(''); }}>Add</button></div><div className='flex flex-wrap gap-2'><button className='rounded bg-slate-900 px-3 py-2 text-white dark:bg-slate-100 dark:text-slate-900' onClick={() => exportReportPdf({ id: report.id, user_id: report.userId, address: report.address, city: report.city, county: report.county, state: report.state, zip: report.zip, latitude: 0, longitude: 0, main_image_url: null, property_images: [], zillow_estimate: null, realtor_estimate: null, estimated_arv: report.myArv, upset_price: report.upsetPrice, star_rating: report.starRating, report_data: report.details, custom_fields: report.customFields, share_token: null, created_at: report.createdAt })}>Download PDF</button><button className='rounded border px-3 py-2' onClick={() => { const nextToken = createShareToken(); const updated = { ...report, details: { ...report.details, shareToken: nextToken } }; db.updateReport(updated); setReport(updated); navigator.clipboard.writeText(shareUrl(nextToken)).catch(() => undefined); }}>Share report</button><button className='rounded border border-red-400 px-3 py-2 text-red-600' onClick={() => { if (!window.confirm('Delete this report?')) return; db.deleteReport(report.id, user); nav('/'); }}>Delete report</button></div>{token && <p className='text-sm'>Share URL: {shareUrl(token)}</p>}</div>;
}
