import { useEffect, useState } from 'react';
import { listReports } from '../lib/db';
import type { Report } from '../types';

export function DashboardPage() {
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    listReports().then(setReports).catch(console.error);
  }, []);

  return <div className='space-y-4'><h1 className='text-xl font-semibold'>Reports Dashboard</h1><div className='card space-y-2'>{reports.length===0?<p>No reports found.</p>:reports.map(r=><div key={r.id} className='border rounded p-2'><p className='font-medium'>{r.address}</p><p className='text-xs text-slate-600'>{r.city}, {r.state} · {new Date(r.created_at).toLocaleString()}</p></div>)}</div></div>;
}
