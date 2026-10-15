'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('mode') === 'login') setMode('login');
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'signup' ? { name, email, password } : { email, password }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        if (response.status >= 500) throw new Error(data?.message || 'The account service is temporarily unavailable. Please try again shortly.');
        throw new Error(data?.message || 'Please check your details and try again.');
      }
      const requestedNext = new URLSearchParams(window.location.search).get('next');
      const safeNext = requestedNext && requestedNext.startsWith('/') && !requestedNext.startsWith('//') ? requestedNext : '/dashboard';
      router.replace(safeNext);
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'We could not complete this request. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return <main className="auth-shell">
    <div className="auth-aside">
      <Link className="brand" href="/">PageFix<span>AI</span></Link>
      <div className="auth-aside-copy"><div className="eyebrow eyebrow-light">EVIDENCE BEFORE OPINIONS</div><h2>Find the issue.<br/>Understand the why.<br/><span>Verify the fix.</span></h2><p>Practical website diagnostics for teams who need clear evidence, not invented metrics or generic recommendations.</p><div className="auth-assurance"><span>✓</span> Findings grounded in captured page evidence</div><div className="auth-assurance"><span>✓</span> Clear limits around private business data</div><div className="auth-assurance"><span>✓</span> Rechecks that preserve audit history</div></div>
      <div className="auth-aside-foot">PageFix AI · Website diagnostics with honest limits</div>
    </div>
    <section className="auth-panel">
      <div className="auth-card">
        <div className="auth-mobile-brand"><Link className="brand" href="/">PageFix<span>AI</span></Link></div>
        <div className="eyebrow">{mode === 'signup' ? 'CREATE YOUR WORKSPACE' : 'YOUR WORKSPACE AWAITS'}</div>
        <h1>{mode === 'signup' ? 'Start with the evidence.' : 'Welcome back.'}</h1>
        <p className="muted">{mode === 'signup' ? 'Create an account to inspect pages, organize findings and track the fixes you make.' : 'Sign in to continue your website diagnostics workflow.'}</p>
        <form onSubmit={submit}>
          {mode === 'signup' && <label>Name<input value={name} onChange={e => setName(e.target.value)} required minLength={2} maxLength={80} autoComplete="name" placeholder="Your name"/></label>}
          <label>Email address<input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" maxLength={320} placeholder="you@company.com"/></label>
          <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} maxLength={128} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'}/></label>
          {error && <div className="error-box" role="alert"><strong>{mode === 'signup' ? 'Account creation failed' : 'Sign-in failed'}</strong><p style={{margin:'5px 0 0'}}>{error}</p></div>}
          <button className="primary-button auth-submit" disabled={loading}>{loading ? 'Please wait…' : mode === 'signup' ? 'Create account →' : 'Sign in →'}</button>
        </form>
        <div className="auth-switch">{mode === 'signup' ? 'Already have an account?' : 'New to PageFix AI?'} <button onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setError(''); }} type="button">{mode === 'signup' ? 'Sign in' : 'Create account'}</button></div>
        {mode === 'login' && <Link className="auth-forgot" href="/auth/forgot-password">Forgot your password?</Link>}
        <p className="auth-legal">By continuing, you agree to use PageFix only on websites you are authorized to inspect. Read our <Link href="/privacy">Privacy notice</Link> and <Link href="/security">Security practices</Link>.</p>
      </div>
    </section>
  </main>;
}
