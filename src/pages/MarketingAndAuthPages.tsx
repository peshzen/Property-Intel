export function LandingPage() {
  return <div className='mx-auto max-w-6xl space-y-16 py-12'>
    <section className='card bg-gradient-to-br from-indigo-500/20 via-cyan-500/10 to-transparent p-10 text-center'><h1>Analyze Properties Like a Professional Investor</h1><p className='mx-auto mt-3 max-w-2xl text-slate-500'>Generate AI-powered comp reports, ARV estimates, property insights, and investor analysis in seconds.</p><div className='mt-6 flex justify-center gap-3'><button className='btn-primary'>Start Free Trial</button><button className='btn-secondary'>Book Demo</button></div></section>
  </div>;
}

export function AuthPage({ title }: { title: string }) {
  return <div className='flex min-h-[70vh] items-center justify-center'><div className='card w-full max-w-md p-6 space-y-3'><h1 className='text-2xl'>{title}</h1><input className='input' placeholder='Email' /><input className='input' placeholder='Password' type='password' /><button className='btn-primary w-full'>Continue</button><button className='btn-secondary w-full'>Continue with Google</button></div></div>;
}
