export function SettingsPage() {
  return <div className='space-y-6'>
    <h1>Profile & Settings</h1>
    <section className='grid gap-4 md:grid-cols-2'>
      <article className='card p-5 space-y-3'><h2 className='text-lg'>Profile</h2><input className='input' defaultValue='Jordan Investor' /><input className='input' defaultValue='jordan@propertyintel.ai' /><button className='btn-primary'>Save profile</button></article>
      <article className='card p-5 space-y-3'><h2 className='text-lg'>Preferences</h2><label className='text-sm text-slate-500'>Default comp radius</label><input className='input' defaultValue='1.0 mile' /><label className='text-sm text-slate-500'>Notification cadence</label><select className='input'><option>Realtime</option><option>Daily digest</option></select></article>
    </section>
  </div>;
}
