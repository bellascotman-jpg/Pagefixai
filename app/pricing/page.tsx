'use client';

import { useEffect, useState } from 'react';

const plans = [
  { id: 'starter_monthly', name: 'Starter', price: '$19', period: '/month', units: '20 audit units/month', desc: 'For individual store owners.' },
  { id: 'starter_annual', name: 'Starter', price: '$190', period: '/year', units: '20 audit units/month', desc: 'Annual Starter billing.' },
  { id: 'growth_monthly', name: 'Growth', price: '$49', period: '/month', units: '100 audit units/month', desc: 'For serious optimization work.', popular: true },
  { id: 'growth_annual', name: 'Growth', price: '$490', period: '/year', units: '100 audit units/month', desc: 'Annual Growth billing.' },
  { id: 'agency_monthly', name: 'Agency', price: '$99', period: '/month', units: '300 audit units/month', desc: 'For multi-client workflows.' },
  { id: 'agency_annual', name: 'Agency', price: '$990', period: '/year', units: '300 audit units/month', desc: 'Annual Agency billing.' },
  { id: 'founding_lifetime', name: 'Founding Lifetime', price: '$799', period: 'one time', units: '50 units/month', desc: 'Growth-level functionality while the real founding offer remains open.' },
];

export default function PricingPage() {
  const [error, setError] = useState(''); const [loading, setLoading] = useState(''); const [founding, setFounding] = useState<{ open: boolean; remaining: number } | null>(null);
  useEffect(() => { fetch('/api/billing/founding-status').then(r => r.json()).then(setFounding).catch(() => undefined); }, []);
  async function checkout(planId: string) {
    setError(''); setLoading(planId);
    try { const r = await fetch('/api/billing/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ planId }) }); const data = await r.json(); if (!r.ok) throw new Error(data.message || data.error || 'Checkout failed.'); window.location.href = data.url; }
    catch (e) { setError(e instanceof Error ? e.message : 'Checkout failed.'); setLoading(''); }
  }
  return <main><div className="container" style={{ padding: '70px 0' }}><a className="brand" href="/">PageFix <span>AI</span></a><div style={{ maxWidth: 760, marginTop: 48 }}><div className="label">Pricing</div><h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', lineHeight: 1 }}>Pay for evidence, not AI theatre.</h1><p className="muted" style={{ fontSize: 18 }}>Every audit produces observable evidence, prioritized findings and practical fixes. Annual prices are explicit and use stable server-side plan IDs.</p></div>{error && <div className="error-box" style={{ marginTop: 24 }}>{error}</div>}<div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', marginTop: 40 }}>{plans.map(plan => <article className="card" key={plan.id} style={{ position: 'relative' }}>{plan.popular && <span className="badge" style={{ position: 'absolute', top: 18, right: 18 }}>MOST POPULAR</span>}<div className="label">{plan.name}</div><h2 style={{ fontSize: 34, margin: '12px 0 4px' }}>{plan.price}</h2><span className="muted">{plan.period}</span><p>{plan.units}</p><p className="muted">{plan.desc}</p>{plan.id === 'founding_lifetime' && <p className="badge">{founding ? founding.open ? `${founding.remaining} slots remaining` : 'SOLD OUT / EXPIRED' : 'Checking availability…'}</p>}<button className="primary-button" style={{ width: '100%', marginTop: 12 }} onClick={() => checkout(plan.id)} disabled={!!loading || (plan.id === 'founding_lifetime' && founding?.open === false)}>{loading === plan.id ? 'Opening checkout…' : 'Choose plan'}</button></article>)}</div><p className="muted" style={{ marginTop: 28 }}>Flutterwave is the payment provider. Paid access is granted only after server-side transaction verification and webhook processing.</p></div></main>;
}
