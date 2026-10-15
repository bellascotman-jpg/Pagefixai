'use client';

import Link from 'next/link';
import { useState } from 'react';

const plans = [
  { id: 'starter_monthly', name: 'Starter', price: '$19', period: '/month', units: '20 audit units / month', desc: 'For individual store owners getting started.', features: ['Evidence-based page audits', 'Prioritized findings', 'Practical fix guidance', 'Audit history'] },
  { id: 'starter_annual', name: 'Starter', price: '$190', period: '/year', units: '20 audit units / month', desc: 'A full year of Starter access.', features: ['All Starter features', 'Annual billing', 'Predictable yearly cost'] },
  { id: 'growth_monthly', name: 'Growth', price: '$49', period: '/month', units: '100 audit units / month', desc: 'For teams running regular optimization work.', popular: true, features: ['Everything in Starter', 'Competitor intelligence', 'Message-match review', 'AI-assisted copy suggestions'] },
  { id: 'growth_annual', name: 'Growth', price: '$490', period: '/year', units: '100 audit units / month', desc: 'A full year of Growth access.', features: ['All Growth features', 'Annual billing', 'Predictable yearly cost'] },
  { id: 'agency_monthly', name: 'Agency', price: '$99', period: '/month', units: '300 audit units / month', desc: 'For consultants and multi-client workflows.', features: ['Everything in Growth', 'Higher monthly audit allowance', 'Agency workspace capability'] },
  { id: 'agency_annual', name: 'Agency', price: '$990', period: '/year', units: '300 audit units / month', desc: 'A full year of Agency access.', features: ['All Agency features', 'Annual billing', 'Predictable yearly cost'] },
];

export default function PricingPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState('');

  async function checkout(planId: string) {
    setError('');
    setLoading(planId);
    try {
      const r = await fetch('/api/billing/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ planId }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || data.error || 'Checkout failed.');
      if (!data.url) throw new Error('The payment provider did not return a checkout URL.');
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Checkout failed.');
      setLoading('');
    }
  }

  return <main>
    <header className="topbar"><Link className="brand" href="/">PageFix <span>AI</span></Link><div style={{ display: 'flex', gap: 18, alignItems: 'center' }}><Link href="/">Overview</Link><Link href="/auth">Sign in</Link></div></header>
    <div className="container" style={{ padding: '68px 0 80px' }}>
      <div style={{ maxWidth: 740, margin: '0 auto', textAlign: 'center' }}>
        <div className="label">Straightforward pricing</div>
        <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.2rem)', lineHeight: 1.04, letterSpacing: '-.06em', margin: '18px 0' }}>Pay for useful evidence.<br /><span style={{ color: 'var(--teal)' }}>Not AI theatre.</span></h1>
        <p className="muted" style={{ fontSize: 16 }}>Choose an allowance that fits your workflow. Each audit is based on observable page evidence, and business outcomes are never guaranteed.</p>
      </div>
      {error && <div className="error-box" style={{ maxWidth: 700, margin: '24px auto 0' }} role="alert">{error}</div>}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 16, marginTop: 42 }}>
        {plans.map(plan => <article className="card" key={plan.id} style={{ position: 'relative', display: 'flex', flexDirection: 'column', borderColor: plan.popular ? '#8bcfc0' : 'var(--line)', boxShadow: plan.popular ? '0 12px 34px rgba(8,127,115,.08)' : 'none' }}>
          {plan.popular && <span className="badge" style={{ alignSelf: 'flex-start', marginBottom: 12 }}>MOST POPULAR</span>}
          <div className="label">{plan.name}</div>
          <h2 style={{ fontSize: 37, letterSpacing: '-.06em', margin: '12px 0 0' }}>{plan.price}<span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', letterSpacing: 0 }}>{plan.period}</span></h2>
          <p style={{ fontWeight: 800, fontSize: 12, margin: '7px 0' }}>{plan.units}</p>
          <p className="muted" style={{ fontSize: 13, minHeight: 42 }}>{plan.desc}</p>
          <div style={{ borderTop: '1px solid var(--line)', paddingTop: 16, marginTop: 8, flex: 1 }}>
            {plan.features.map(feature => <p key={feature} style={{ display: 'flex', gap: 9, fontSize: 12, margin: '10px 0', color: '#526966' }}><span style={{ color: 'var(--teal)', fontWeight: 900 }}>✓</span>{feature}</p>)}
          </div>
          <button className="primary-button" style={{ width: '100%', marginTop: 18 }} onClick={() => checkout(plan.id)} disabled={!!loading}>{loading === plan.id ? 'Opening checkout…' : 'Choose plan'}</button>
        </article>)}
      </div>
      <div className="card" style={{ maxWidth: 850, margin: '28px auto 0', background: '#f0f8f4' }}>
        <h2 style={{ fontSize: 18, marginTop: 0 }}>What counts as an audit unit?</h2>
        <p className="muted" style={{ fontSize: 13, marginBottom: 0 }}>Usage allowances are enforced by the application. Review your workspace balance before starting work. Public-page audits cannot determine private revenue, traffic, conversion rate or checkout abandonment without authorized data connections.</p>
      </div>
      <p className="muted" style={{ textAlign: 'center', fontSize: 11, marginTop: 24 }}>Payments are processed through the configured provider. Access is granted only after server-side transaction verification.</p>
    </div>
  </main>;
}
