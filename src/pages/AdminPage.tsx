export function AdminPage() {
  return <div className='space-y-6'>
    <div className='flex items-center justify-between'><h1>Admin Command Center</h1><button className='btn-primary'>Export analytics</button></div>
    <section className='grid gap-4 md:grid-cols-3'>
      {['Pending Approvals', 'Active Investors', 'Reports This Week'].map((item, idx) => <article key={item} className='metric-card'><p className='text-sm text-slate-500'>{item}</p><p className='mt-2 text-2xl font-semibold'>{[14, 402, 298][idx]}</p></article>)}
    </section>
    <section className='card overflow-hidden'>
      <div className='border-b border-slate-200 p-4 dark:border-slate-700'><h2 className='text-lg'>User Approval Queue</h2></div>
      <div className='overflow-auto'>
        <table className='min-w-full text-sm'><thead className='bg-slate-50 text-left dark:bg-slate-800'><tr><th className='p-3'>Name</th><th className='p-3'>Email</th><th className='p-3'>Plan</th><th className='p-3'>Actions</th></tr></thead>
          <tbody>{['Alex Thompson', 'Maya Green', 'Chris Cole'].map((u) => <tr key={u} className='border-t border-slate-100 dark:border-slate-800'><td className='p-3'>{u}</td><td className='p-3 text-slate-500'>{u.toLowerCase().replace(' ', '.')}@mail.com</td><td className='p-3'>Pro</td><td className='p-3'><div className='flex gap-2'><button className='btn-secondary'>Deny</button><button className='btn-primary'>Approve</button></div></td></tr>)}</tbody>
        </table>
      </div>
    </section>
  </div>;
}
