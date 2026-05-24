import { useEffect, useState } from 'react';
import { listProfilesForAdmin, listReports, updateUserApproval } from '../lib/db';
import type { Profile, Report } from '../types';

export function AdminPage(){
  const [profiles,setProfiles]=useState<Profile[]>([]);
  const [reports,setReports]=useState<Report[]>([]);

  useEffect(()=>{ listProfilesForAdmin().then(setProfiles).catch(console.error); listReports().then(setReports).catch(console.error); },[]);
  const setApproval = async (id:string,status:Profile['approval_status'])=>{ await updateUserApproval(id,status); setProfiles(prev=>prev.map(p=>p.id===id?{...p,approval_status:status}:p)); };

  return <div className='space-y-4'><h1 className='text-xl font-semibold'>Admin Dashboard</h1><div className='card'><h2 className='font-semibold mb-2'>Users</h2>{profiles.map(p=><div key={p.id} className='border rounded p-2 mb-2'><p>{p.email} · {p.role} · {p.approval_status}</p><div className='space-x-2 mt-1'><button className='px-2 py-1 border rounded' onClick={()=>setApproval(p.id,'approved')}>Approve</button><button className='px-2 py-1 border rounded' onClick={()=>setApproval(p.id,'denied')}>Deny</button></div></div>)}</div><div className='card'><h2 className='font-semibold mb-2'>Reports</h2>{reports.map(r=><div key={r.id} className='border rounded p-2 mb-2'>{r.address} · {r.city}, {r.state}</div>)}</div></div>;
}
