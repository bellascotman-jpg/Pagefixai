'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'We could not process the request.');
      setMessage(data.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'We could not process the request.');
    } finally {
      setLoading(false);
    }
  }

  return <main className="auth-shell"><div className="auth-card">
    <Link className="brand" href="/">PageFix <span>AI</span></Link>
    <h1>Reset your password.</h1>
    <p className="muted">Enter the email address associated with your account. If the account exists and email delivery is configured, we will send a one-time reset link.</p>
    <form onSubmit={submit}>
      <label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} required maxLength={320} autoComplete="email" /></label>
      {error && <div className="error-box" role="alert">{error}</div>}
      {message && <div className="card" role="status" style={{ background: '#eff8f4', padding: 12, fontSize: 13 }}>{message}</div>}
      <button className="primary-button" disabled={loading}>{loading ? 'Sending…' : 'Send reset link'}</button>
    </form>
    <Link className="text-button" href="/auth?mode=login" style={{ display: 'inline-block' }}>Return to sign in</Link>
  </div></main>;
}
