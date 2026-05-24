import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function ReportDetailPage() {
  const { id } = useParams();
  const [report, setReport] = useState<any>(null);
  const [comps, setComps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReport = async () => {
      if (!id) return;
      setLoading(true);
      const [{ data: reportData }, { data: compsData }] = await Promise.all([
        supabase.from('reports').select('*').eq('id', id).single(),
        supabase.from('comps').select('*').eq('report_id', id),
      ]);
      setReport(reportData);
      setComps(compsData ?? []);
      setLoading(false);
    };

    loadReport();
  }, [id]);

  if (loading) return <p>Loading report...</p>;
  if (!report) return <p>Report not found.</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Report Detail</h1>
      <img src={report.main_image_url} className="w-full rounded-xl" />
      <div className="card space-y-1">
        <p>{report.address}</p>
        <p>
          ARV ${Number(report.estimated_arv ?? 0).toLocaleString()} | Suggested Offer $
          {Number(report.upset_price ?? 0).toLocaleString()}
        </p>
      </div>
      <div className="card">
        <h2 className="mb-2 font-medium">Comps ({comps.length})</h2>
        <ul className="space-y-1 text-sm">
          {comps.map((comp) => (
            <li key={comp.id}>
              {comp.address} — ${Number(comp.sold_price ?? 0).toLocaleString()} ({comp.square_feet} sqft)
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
