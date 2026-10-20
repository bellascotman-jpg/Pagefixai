'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

function PasswordVisibilityButton({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={visible ? 'Hide password' : 'Show password'}
      aria-pressed={visible}
      title={visible ? 'Hide password' : 'Show password'}
      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, border: 0, borderRadius: 8, background: 'transparent', color: 'var(--muted, #74656a)', cursor: 'pointer' }}
    >
      {visible ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M9.9 5.2A10.8 10.8 0 0112 5c5 0 8.5 4.2 9.5 7-.4 1.1-1.3 2.5-2.7 3.8M6.2 6.2C3.9 7.6 2.8 9.7 2.5 12c1 2.8 4.5 7 9.5 7 1.3 0 2.5-.3 3.5-.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      )}
    </button>
  );
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
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
      <label>New password
        <span style={{ position: 'relative', display: 'block' }}>
          <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required minLength={8} maxLength={128} autoComplete="new-password" style={{ paddingRight: 52, width: '100%' }} />
          <PasswordVisibilityButton visible={showPassword} onToggle={() => setShowPassword(value => !value)} />
        </span>
      </label>
      <label>Confirm password
        <span style={{ position: 'relative', display: 'block' }}>
          <input type={showConfirmation ? 'text' : 'password'} value={confirmation} onChange={e => setConfirmation(e.target.value)} required minLength={8} maxLength={128} autoComplete="new-password" style={{ paddingRight: 52, width: '100%' }} />
          <PasswordVisibilityButton visible={showConfirmation} onToggle={() => setShowConfirmation(value => !value)} />
        </span>
      </label>
      {error && <div className="error-box" role="alert">{error}</div>}
      {success && <div className="card" role="status" style={{ background: '#eff8f4', padding: 12, fontSize: 13 }}>{success}</div>}
      <button className="primary-button" disabled={loading || !token}>{loading ? 'Updating password…' : 'Update password'}</button>
    </form>
    <Link className="text-button" href="/auth?mode=login" style={{ display: 'inline-block' }}>Return to sign in</Link>
  </div></main>;
}
