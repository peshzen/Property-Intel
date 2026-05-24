import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { geocodeAddress } from '../services/geocodingProvider';
import { getStreetViewUrl } from '../services/streetViewProvider';
import { getPropertyFacts } from '../services/propertyDataProvider';
import { getComps } from '../services/compsProvider';
import { getPublicRecordsChecks } from '../services/publicRecordsProvider';
import { scoreReport } from '../services/reportScoringService';
import { supabase } from '../lib/supabase';

interface ToastState {
  type: 'success' | 'error';
  message: string;
}

export function CreateReportPage() {
  const [address, setAddress] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const navigate = useNavigate();

  const showToast = (nextToast: ToastState) => {
    setToast(nextToast);
    setTimeout(() => setToast(null), 3000);
  };

  const generate = async () => {
    const trimmedAddress = address.trim();
    if (!trimmedAddress) {
      showToast({ type: 'error', message: 'Please enter a property address.' });
      return;
    }

    try {
      setLoading(true);
      const geo = await geocodeAddress(trimmedAddress);
      const facts = await getPropertyFacts(trimmedAddress);
      const comps = await getComps(1);
      const checks = await getPublicRecordsChecks();
      const score = scoreReport(facts, comps);
      const mainImage =
        getStreetViewUrl(geo.latitude, geo.longitude) ??
        `https://placehold.co/1200x675?text=${encodeURIComponent('Street View Unavailable')}`;

      const reportPayload = {
        address: trimmedAddress,
        city: geo.city,
        county: geo.county,
        state: geo.state,
        zip: geo.zip,
        latitude: geo.latitude,
        longitude: geo.longitude,
        main_image_url: mainImage,
        estimated_arv: score.estimatedArv,
        upset_price: score.suggestedMaxOffer,
        star_rating: Math.max(1, Math.round(score.confidence / 20)),
        report_data: {
          geocode: geo,
          facts,
          checks,
          metrics: {
            avgCompPrice: score.avgCompPrice,
            pricePerSquareFoot: score.ppsf,
            estimatedArv: score.estimatedArv,
            suggestedOffer: score.suggestedMaxOffer,
            confidenceScore: score.confidence,
          },
        },
      };

      const { data: report, error: reportError } = await supabase
        .from('reports')
        .insert(reportPayload)
        .select('id')
        .single();

      if (reportError || !report?.id) {
        throw new Error(reportError?.message ?? 'Failed to save report.');
      }

      const compsPayload = comps.map((comp) => ({
        report_id: report.id,
        address: comp.address,
        distance_miles: comp.distanceMiles,
        beds: comp.beds,
        baths: comp.baths,
        square_feet: comp.squareFeet,
        sold_price: comp.soldPrice,
        sold_date: comp.soldDate,
        year_built: comp.yearBuilt,
        source: comp.source,
      }));

      const { error: compsError } = await supabase.from('comps').insert(compsPayload);
      if (compsError) {
        throw new Error(compsError.message);
      }

      setResult({ geo, facts, comps, checks, score, mainImage, reportId: report.id });
      showToast({ type: 'success', message: 'Report generated successfully.' });
      navigate(`/reports/${report.id}`);
    } catch (error) {
      console.error(error);
      showToast({ type: 'error', message: 'Unable to generate report. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Create Report</h1>
      {toast && (
        <div
          className={`rounded border p-3 text-sm ${
            toast.type === 'success'
              ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
              : 'border-rose-300 bg-rose-50 text-rose-900'
          }`}
        >
          {toast.message}
        </div>
      )}
      <div className="card">
        <input
          className="w-full rounded border p-2"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Paste property address"
        />
        <button onClick={generate} className="mt-2 rounded bg-slate-900 px-4 py-2 text-white" disabled={loading}>
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
      </div>
      {result && (
        <div className="grid gap-4">
          <img src={result.mainImage} className="w-full rounded-xl" />
          <div className="card">
            <p>
              {result.geo.normalizedAddress}, {result.geo.city}, {result.geo.state}
            </p>
            <p>
              ARV ${result.score.estimatedArv.toLocaleString()} | Max Offer $
              {result.score.suggestedMaxOffer.toLocaleString()}
            </p>
            <p className="mt-2 text-xs text-amber-600">
              Public-record checks are informational only and must be independently verified by title/search
              professionals.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
