import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { geocodeAddress } from '../services/geocodingProvider';
import { fetchProperty } from '../services/propertyProvider';
import { fetchComps } from '../services/compsProvider';
import { fetchPublicRecords } from '../services/publicRecordsProvider';
import { fetchStreetViewUrl } from '../services/streetViewProvider';
import { calculateInvestorMetrics } from '../services/valuationProvider';
import { generateAiSummary } from '../services/aiAnalysisService';
import { persistReport } from '../services/reportGenerator';

const stages = ['Analyzing market...', 'Finding comparable sales...', 'Running valuation models...', 'Checking public records...', 'Generating AI analysis...'];

export function CreateReportPage() {
  const navigate = useNavigate();
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState('');
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);

  const generate = async () => {
    const trimmedAddress = address.trim();
    if (!trimmedAddress) return setToast({ kind: 'error', message: 'Address is required.' });
    setLoading(true); setToast(null);
    try {
      setStage(stages[0]);
      const geocode = await geocodeAddress(trimmedAddress);
      const property = await fetchProperty(geocode);
      setStage(stages[1]);
      const comps = await fetchComps(geocode, property, 1);
      setStage(stages[2]);
      const metrics = calculateInvestorMetrics(property, comps);
      setStage(stages[3]);
      const records = await fetchPublicRecords(geocode);
      const mainImage = await fetchStreetViewUrl(geocode.latitude, geocode.longitude);
      setStage(stages[4]);
      const aiSummary = await generateAiSummary({ geocode, property, comps, records, metrics });
      const report = await persistReport({ geocode, property, comps, records, metrics, mainImage, aiSummary });
      setToast({ kind: 'success', message: 'Investor report generated successfully.' });
      navigate(`/reports/${report.id}`);
    } catch (error) {
      setToast({ kind: 'error', message: error instanceof Error ? error.message : 'Failed to generate report.' });
    } finally {
      setLoading(false); setStage('');
    }
  };

  return <div className='space-y-4'>
    <h1 className='text-xl font-semibold'>Create Report</h1>
    {toast && <div className={`rounded border p-3 text-sm ${toast.kind === 'success' ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-red-300 bg-red-50 text-red-800'}`}>{toast.message}</div>}
    <div className='card'>
      <input className='w-full rounded border p-2' value={address} onChange={(e) => setAddress(e.target.value)} placeholder='Paste property address' />
      <button onClick={generate} disabled={loading} className='mt-2 rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-60'>{loading ? 'Generating...' : 'Generate Report'}</button>
      {loading && <p className='mt-2 text-sm text-slate-600 animate-pulse'>{stage}</p>}
    </div>
  </div>;
}
