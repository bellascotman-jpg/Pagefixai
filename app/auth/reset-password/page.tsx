'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get('token') || '');
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!token) { setError('This reset link is missing its token. Request a new link.'); return; }
    if (password !== confirmation) { setError('The passwords do not match.'); return; }
    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Password reset failed.');
      setSuccess(data.message || 'Password updated.');
      setPassword('');
      setConfirmation('');
      setTimeout(() => router.push('/auth?mode=login'), 1400);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  }

  return <main className="auth-shell"><div className="auth-card">
    <Link className="brand" href="/">PageFix <span>AI</span></Link>
    <h1>Choose a new password.</h1>
    <p className="muted">Reset links expire after 30 minutes and can be used only once.</p>
    <form onSubmit={submit}>
      <label>New password<input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} maxLength={128} autoComplete="new-password" /></label>
      <label>Confirm password<input type="password" value={confirmation} onChange={e => setConfirmation(e.target.value)} required minLength={8} maxLength={128} autoComplete="new-password" /></label>
      {error && <div className="error-box" role="alert">{error}</div>}
      {success && <div className="card" role="status" style={{ background: '#eff8f4', padding: 12, fontSize: 13 }}>{success}</div>}
      <button className="primary-button" disabled={loading || !token}>{loading ? 'Updating password…' : 'Update password'}</button>
    </form>
    <Link className="text-button" href="/auth?mode=login" style={{ display: 'inline-block' }}>Return to sign in</Link>
  </div></main>;
}
