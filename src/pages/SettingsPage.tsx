import { useEffect, useState } from 'react';
import { loadProfile, updateProfile } from '../lib/db';
import type { Profile } from '../types';
import { callAuthedFunction } from '../services/netlifyClient';

type KeyStatus = 'not_connected' | 'connected' | 'connection_failed';

const statusClass: Record<KeyStatus, string> = {
  not_connected: 'bg-slate-100 text-slate-700',
  connected: 'bg-emerald-100 text-emerald-700',
  connection_failed: 'bg-red-100 text-red-700',
};
const statusLabel: Record<KeyStatus, string> = {
  not_connected: 'Not Connected',
  connected: 'Connected',
  connection_failed: 'Connection Failed',
};

export function SettingsPage(){
  const [fullName,setFullName]=useState('');
  const [company,setCompany]=useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [maskedKey, setMaskedKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState<KeyStatus>('not_connected');
  const [loadingSaveKey, setLoadingSaveKey] = useState(false);
  const [loadingTestKey, setLoadingTestKey] = useState(false);
  const [loadingDeleteKey, setLoadingDeleteKey] = useState(false);
  const [message, setMessage] = useState('');
  const [debug, setDebug] = useState<any>(null);

  useEffect(()=>{loadProfile().then((p: Profile | null)=>{if(p){setFullName(p.full_name ?? ''); setCompany(p.company ?? ''); setKeyStatus((p.google_maps_api_key_status as KeyStatus) ?? 'not_connected'); setMaskedKey(p.google_maps_api_key_encrypted ? 'Saved key on file' : '');}}).catch(()=>setMessage('Failed to load settings.'));},[]);
  const save = async ()=>{ await updateProfile({ full_name: fullName, company }); setMessage('Profile saved successfully.'); };

  useEffect(() => {
    callAuthedFunction<any>('google-maps-debug').then(setDebug).catch(() => setDebug(null));
  }, []);


  const saveApiKey = async () => {
    if (!apiKeyInput.trim()) { setMessage('Please enter a Google Maps API key.'); return; }
    setLoadingSaveKey(true);
    try {
      const data = await callAuthedFunction<{ maskedKey?: string; status?: KeyStatus }>('save-google-maps-key', { apiKey: apiKeyInput.trim() });
      setMaskedKey(data.maskedKey ?? 'Saved');
      setKeyStatus(data.status ?? 'not_connected');
      setApiKeyInput('');
      setMessage('Google Maps API key saved successfully.');
    } catch (error) { setMessage((error as Error).message); } finally { setLoadingSaveKey(false); }
  };

  const testApiKey = async () => {
    setLoadingTestKey(true);
    try {
      const data = await callAuthedFunction<{ ok: boolean; status: KeyStatus; maskedKey?: string; googleStatus?: string; error?: string }>('test-google-maps-key');
      setKeyStatus(data.status ?? 'connection_failed');
      setMaskedKey(data.maskedKey ?? maskedKey);
      setMessage(data.ok
        ? `Google Maps connected successfully (${data.googleStatus ?? 'OK'}).`
        : `${data.error ?? 'Connection failed.'} (${data.googleStatus ?? 'UNKNOWN_ERROR'})`);
    } catch { setMessage('Connection failed. Check billing, enabled APIs, API restrictions, and allowed referrers/IPs.'); } finally { setLoadingTestKey(false); }
  };

  const deleteApiKey = async () => {
    if (!confirm('Remove your saved Google Maps API key?')) return;
    setLoadingDeleteKey(true);
    try {
      await callAuthedFunction('delete-google-maps-key');
      setApiKeyInput('');
      setMaskedKey('');
      setKeyStatus('not_connected');
      setMessage('Google Maps API key removed.');
    } catch (error) { setMessage((error as Error).message); } finally { setLoadingDeleteKey(false); }
  };

  return <div className='space-y-4'><h1 className='text-xl font-semibold'>Profile & Settings</h1><div className='card space-y-2'><input className='w-full border p-2 rounded' value={fullName} onChange={e=>setFullName(e.target.value)} placeholder='Full name'/><input className='w-full border p-2 rounded' value={company} onChange={e=>setCompany(e.target.value)} placeholder='Company'/><button className='px-4 py-2 bg-slate-900 text-white rounded' onClick={save}>Save Profile</button></div>
  <div className='card space-y-3 p-4'>
    <div className='flex items-center justify-between gap-2 flex-wrap'>
      <h2 className='text-lg font-semibold'>Google Maps Integration</h2>
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClass[keyStatus]}`}>{statusLabel[keyStatus]}</span>
    </div>
    <p className='text-sm text-slate-600'>Your Google Maps API key is used to load Street View images, geocoding, maps, and comp radius maps for your reports.</p>
    <p className='text-xs text-slate-500'>Enable: Maps JavaScript API, Geocoding API, Street View Static API, and Places API (if autocomplete is used).</p>
    <div className='flex gap-2'>
      <input type={showApiKey ? 'text' : 'password'} className='w-full border p-2 rounded' value={apiKeyInput || maskedKey} onChange={(e)=>setApiKeyInput(e.target.value)} placeholder='AIzaSy...'/>
      <button className='px-3 py-2 border rounded' onClick={()=>setShowApiKey((v)=>!v)}>{showApiKey ? 'Hide' : 'Show'}</button>
    </div>
    <div className='flex flex-wrap gap-2'>
      <button disabled={loadingSaveKey || loadingDeleteKey || loadingTestKey} className='px-4 py-2 bg-slate-900 text-white rounded disabled:opacity-60' onClick={saveApiKey}>{loadingSaveKey ? 'Saving...' : 'Save API Key'}</button>
      <button disabled={loadingTestKey || loadingSaveKey || loadingDeleteKey} className='px-4 py-2 border rounded disabled:opacity-60' onClick={testApiKey}>{loadingTestKey ? 'Testing...' : 'Test Connection'}</button>
      <button disabled={loadingDeleteKey || loadingSaveKey || loadingTestKey} className='px-4 py-2 border border-red-300 text-red-700 rounded disabled:opacity-60' onClick={deleteApiKey}>{loadingDeleteKey ? 'Removing...' : 'Remove API Key'}</button>
    </div>
    {message && <p className='text-sm'>{message}</p>}
    {keyStatus !== 'not_connected' && <p className='text-xs text-slate-500'>Connection failed. Check billing, enabled APIs, API restrictions, and allowed referrers/IPs.</p>}
  </div>
  {debug?.isAdmin && <div className='card p-4 space-y-1 text-xs'>
    <h3 className='font-semibold text-sm'>Google Maps Diagnostics (Admin)</h3>
    <p>Global key configured: {debug.globalKeyConfigured ? 'yes' : 'no'}</p>
    <p>Saved user key exists: {debug.savedUserKeyExists ? 'yes' : 'no'}</p>
    <p>Last status: {debug.lastStatus ?? 'unknown'}</p>
    <p>Last tested: {debug.lastTestedAt ?? 'never'}</p>
    <p>Geocode test: {debug.geocodeTest ?? 'not_run'}</p>
    <p>Street View test: {debug.streetViewTest ?? 'not_run'}</p>
  </div>}
</div>;
}
