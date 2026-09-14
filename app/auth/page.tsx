'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(''); setLoading(true);
    try {
      const response = await fetch(`/api/auth/${mode}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(mode === 'signup' ? { name, email, password } : { email, password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Authentication failed.');
      router.push('/dashboard'); router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : 'Authentication failed.'); }
    finally { setLoading(false); }
  }

  return <main className="auth-shell"><div className="auth-card"><a className="brand" href="/">PageFix <span>AI</span></a><h1>{mode === 'signup' ? 'Start finding purchase friction.' : 'Welcome back.'}</h1><p className="muted">{mode === 'signup' ? 'Create your workspace and run evidence-driven storefront audits.' : 'Sign in to your PageFix workspace.'}</p><form onSubmit={submit}>{mode === 'signup' && <label>Name<input value={name} onChange={e => setName(e.target.value)} required minLength={2} maxLength={80} /></label>}<label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" /></label><label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} /></label>{error && <div className="error-box" role="alert">{error}</div>}<button className="primary-button" disabled={loading}>{loading ? 'Working…' : mode === 'signup' ? 'Create account' : 'Sign in'}</button></form><button className="text-button" onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setError(''); }}>{mode === 'signup' ? 'Already have an account? Sign in' : 'Need an account? Create one'}</button></div></main>;
}
