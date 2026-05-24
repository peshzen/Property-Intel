import { useState } from 'react';
import { LoaderCircle, MapPinned, Search, Sparkles } from 'lucide-react';
import { geocodeAddress } from '../services/geocodingProvider';
import { getStreetViewUrl } from '../services/streetViewProvider';
import { getPropertyFacts } from '../services/propertyDataProvider';
import { getComps } from '../services/compsProvider';
import { getPublicRecordsChecks } from '../services/publicRecordsProvider';
import { scoreReport } from '../services/reportScoringService';

export function CreateReportPage() {
  const [address, setAddress] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    const geo = await geocodeAddress(address);
    const facts = await getPropertyFacts(address);
    const comps = await getComps(1);
    const checks = await getPublicRecordsChecks();
    const score = scoreReport(facts, comps);
    const mainImage = getStreetViewUrl(geo.latitude, geo.longitude) ?? 'https://placehold.co/1400x800?text=No+Street+View';
    setResult({ geo, facts, comps, checks, score, mainImage });
    setLoading(false);
  };

  return <div className='space-y-6'>
    <section className='card overflow-hidden p-6 md:p-8'>
      <div className='mb-6 max-w-2xl'>
        <h1 className='mb-2 text-3xl'>Analyze Properties Like a Professional Investor</h1>
        <p className='text-slate-500'>Generate AI-powered comp reports, ARV estimates, and investment strategy in seconds.</p>
      </div>
      <div className='grid gap-4 md:grid-cols-[1fr_auto]'>
        <div className='relative'><Search size={18} className='absolute left-4 top-3.5 text-slate-400' /><input className='input pl-10 text-base' value={address} onChange={(e) => setAddress(e.target.value)} placeholder='Enter address, parcel ID, or neighborhood…' /></div>
        <button onClick={generate} className='btn-primary gap-2'>{loading ? <><LoaderCircle size={16} className='animate-spin' />Generating</> : <><Sparkles size={16} />Generate Report</>}</button>
      </div>
      <div className='mt-4 flex flex-wrap gap-2 text-xs text-slate-500'><span className='badge bg-slate-100 dark:bg-slate-800'>AI valuation</span><span className='badge bg-slate-100 dark:bg-slate-800'>Public record checks</span><span className='badge bg-slate-100 dark:bg-slate-800'>Comps & map preview</span></div>
    </section>

    {loading && <section className='grid gap-4 md:grid-cols-3'>{[1, 2, 3].map((i) => <div key={i} className='card h-40 animate-pulse bg-slate-100 dark:bg-slate-800' />)}</section>}

    {result && <section className='grid gap-4 xl:grid-cols-3'>
      <article className='card xl:col-span-2'><img src={result.mainImage} className='h-72 w-full rounded-t-2xl object-cover md:h-96' /><div className='p-5'><p className='font-medium'>{result.geo.normalizedAddress}, {result.geo.city}, {result.geo.state}</p><p className='mt-2 text-sm text-slate-500'>Confidence score: <span className='font-semibold text-emerald-500'>{result.score.confidence}/100</span></p></div></article>
      <article className='card p-5'>
        <h2 className='mb-3 text-lg'>Investor Snapshot</h2>
        <div className='space-y-3 text-sm'>
          <p className='flex justify-between'><span className='text-slate-500'>Estimated ARV</span><span className='font-semibold'>${result.score.estimatedArv.toLocaleString()}</span></p>
          <p className='flex justify-between'><span className='text-slate-500'>Suggested Offer</span><span className='font-semibold'>${result.score.suggestedMaxOffer.toLocaleString()}</span></p>
          <p className='flex justify-between'><span className='text-slate-500'>Nearby Comps</span><span className='font-semibold'>{result.comps.length}</span></p>
        </div>
        <div className='mt-5 rounded-xl bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'>Public-record checks are informational only and must be independently verified by title/search professionals.</div>
        <div className='mt-4 flex items-center gap-2 text-xs text-slate-500'><MapPinned size={14} />Live map and comp overlays available in full report.</div>
      </article>
    </section>}
  </div>;
}
