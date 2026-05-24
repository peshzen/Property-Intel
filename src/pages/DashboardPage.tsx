import { ArrowUpRight, Brain, FileText, Heart, Home, MapPin } from 'lucide-react';

const metrics = [
  { label: 'Total Reports', value: '1,248', delta: '+12.4%', icon: FileText },
  { label: 'Average ARV', value: '$382,440', delta: '+4.1%', icon: Home },
  { label: 'Favorite Properties', value: '86', delta: '+8.7%', icon: Heart },
  { label: 'Top County', value: 'Allegheny', delta: '32 reports', icon: MapPin }
];

export function DashboardPage() {
  return <div className='space-y-6'>
    <section className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
      {metrics.map(({ label, value, delta, icon: Icon }) => <article key={label} className='metric-card'>
        <div className='mb-3 flex items-center justify-between text-slate-500'><span className='text-sm'>{label}</span><Icon size={16} /></div>
        <div className='text-2xl font-semibold'>{value}</div>
        <div className='mt-2 flex items-center gap-1 text-xs text-emerald-500'><ArrowUpRight size={13} />{delta}</div>
      </article>)}
    </section>

    <section className='grid gap-4 xl:grid-cols-3'>
      <article className='card p-5 xl:col-span-2'>
        <div className='mb-4 flex items-center justify-between'><h2 className='text-lg'>Recent Reports</h2><button className='btn-secondary'>View all</button></div>
        <div className='space-y-3'>
          {['2143 Grandview Ave, Pittsburgh', '99 Winding Hill Rd, Erie', '812 Maple St, Lancaster'].map((address) => <div key={address} className='flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700'><div><p className='font-medium'>{address}</p><p className='text-slate-500'>Generated 2 hours ago</p></div><span className='badge bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'>High confidence</span></div>)}
        </div>
      </article>
      <article className='card p-5'>
        <div className='mb-3 flex items-center gap-2'><Brain className='text-indigo-400' size={18} /><h2 className='text-lg'>AI Insights</h2></div>
        <p className='text-sm text-slate-500'>Three off-market zones show margin expansion this week. Prioritize duplex inventory under $190k with rehab under $45k.</p>
      </article>
    </section>
  </div>;
}
