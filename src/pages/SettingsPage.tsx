import { useEffect, useState } from 'react';
import { loadProfile, updateProfile } from '../lib/db';

export function SettingsPage(){
  const [fullName,setFullName]=useState('');
  const [company,setCompany]=useState('');

  useEffect(()=>{loadProfile().then(p=>{if(p){setFullName(p.full_name ?? ''); setCompany(p.company ?? '');}}).catch(console.error);},[]);
  const save = async ()=>{ await updateProfile({ full_name: fullName, company }); };

  return <div className='space-y-4'><h1 className='text-xl font-semibold'>Profile & Settings</h1><div className='card space-y-2'><input className='w-full border p-2 rounded' value={fullName} onChange={e=>setFullName(e.target.value)} placeholder='Full name'/><input className='w-full border p-2 rounded' value={company} onChange={e=>setCompany(e.target.value)} placeholder='Company'/><button className='px-4 py-2 bg-slate-900 text-white rounded' onClick={save}>Save Profile</button></div></div>;
}
