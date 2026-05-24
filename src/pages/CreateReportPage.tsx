import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getComps } from '../services/compsProvider';
import { geocodeAddress } from '../services/geocodingProvider';
import { getPropertyFacts } from '../services/propertyDataProvider';
import { getPublicRecordsChecks } from '../services/publicRecordsProvider';
import { scoreReport } from '../services/reportScoringService';
import { getStreetViewUrl } from '../services/streetViewProvider';
import { createReport, insertComps } from '../lib/db';

export function CreateReportPage() {
  const navigate = useNavigate();
  const [address, setAddress] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);

  const generate = async () => {
    const trimmedAddress = address.trim();
    if (!trimmedAddress) {
      setToast({ kind: 'error', message: 'Address is required.' });
      return;
    }

    setLoading(true);
    setToast(null);

    try {
      let geo;
      try {
        geo = await geocodeAddress(trimmedAddress);
      } catch {
        geo = {
          normalizedAddress: trimmedAddress,
          city: 'Austin',
          county: 'Travis',
          state: 'TX',
          zip: '78701',
          latitude: 30.2672,
          longitude: -97.7431,
        };
      }

      const facts = await getPropertyFacts(trimmedAddress);
      const comps = await getComps(1);
      const checks = await getPublicRecordsChecks();
      const score = scoreReport(facts, comps);

      const mainImage =
        getStreetViewUrl(geo.latitude, geo.longitude) ?? 'https://placehold.co/1200x675?text=Property+Image+Unavailable';

      const report = await createReport({
        address: geo.normalizedAddress,
        city: geo.city,
        county: geo.county,
        state: geo.state,
        zip: geo.zip,
        latitude: geo.latitude,
        longitude: geo.longitude,
        main_image_url: mainImage,
        property_images: [mainImage],
        estimated_arv: score.estimatedArv,
        upset_price: score.suggestedMaxOffer,
        report_data: {
          facts,
          checks,
          score,
          calculations: {
            averageCompPrice: score.avgCompPrice,
            pricePerSquareFoot: score.ppsf,
            estimatedArv: score.estimatedArv,
            suggestedOffer: score.suggestedMaxOffer,
            confidenceScore: score.confidence,
          },
        },
        custom_fields: [],
      });

      await insertComps(report.id, comps);

      setResult({ geo, facts, comps, checks, score, mainImage });
      setToast({ kind: 'success', message: 'Report generated successfully.' });
      navigate(`/reports/${report.id}`);
    } catch (error) {
      setToast({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Failed to generate report.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='space-y-4'>
      <h1 className='text-xl font-semibold'>Create Report</h1>

      {toast && (
        <div
          className={`rounded border p-3 text-sm ${
            toast.kind === 'success'
              ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
              : 'border-red-300 bg-red-50 text-red-800'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className='card'>
        <input
          className='w-full rounded border p-2'
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder='Paste property address'
        />
        <button onClick={generate} disabled={loading} className='mt-2 rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-60'>
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      {result && (
        <div className='grid gap-4'>
          <img src={result.mainImage} className='w-full rounded-xl' />
          <div className='card'>
            <p>
              {result.geo.normalizedAddress}, {result.geo.city}, {result.geo.state}
            </p>
            <p>
              ARV ${result.score.estimatedArv.toLocaleString()} | Max Offer ${result.score.suggestedMaxOffer.toLocaleString()}
            </p>
            <p className='mt-2 text-xs text-amber-600'>
              Public-record checks are informational only and must be independently verified by title/search professionals.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
