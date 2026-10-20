'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import SessionKeepAlive from '@/components/session-keepalive';
import Brand from '@/components/brand';

const plans = [
  {
    id: 'starter_monthly', name: 'Starter', price: '$49', unit: '/ month', audience: 'For founders and store owners who need a clear, repeatable page review.',
    description: 'Find and prioritize issues on the pages that matter most.',
    features: ['50 audit units per month', 'Product page and landing page audits', 'Technical SEO and page metadata checks', 'Buyer-question and objection coverage', 'Evidence-linked findings and confidence labels', 'Prioritized remediation guidance', 'Audit history and report views', 'Manual recheck workflow'],
  },
  {
    id: 'growth_monthly', name: 'Growth', price: '$149', unit: '/ month', audience: 'For growing teams that regularly ship landing pages and storefront changes.',
    description: 'A more complete workflow from diagnosis to verification.',
    popular: true,
    features: ['Everything in Starter', '250 audit units per month', 'Competitor workspace capability', 'Ad-to-page and message-match review', 'AI-assisted copy and fix suggestions', 'Expanded buyer friction diagnostics', 'Recheck comparison and status tracking', 'Team-ready project and store organization', 'Higher audit capacity'],
  },
  {
    id: 'agency_monthly', name: 'Agency', price: '$399', unit: '/ month', audience: 'For consultants and agencies managing multiple client websites.',
    description: 'Higher capacity for repeatable multi-client delivery.',
    features: ['Everything in Growth', '1,000 audit units per month', 'Multi-client project organization', 'Client-ready audit history and findings', 'Repeatable inspection and remediation workflow', 'Higher-volume reporting capacity', 'Priority planning for agency workflows', 'Designed for future client sharing and white-label expansion'],
  },
];

const matrix = [
  ['Public page and product-page audits', 'Included', 'Included', 'Included'],
  ['Evidence-linked findings and confidence', 'Included', 'Included', 'Included'],
  ['Technical SEO and metadata checks', 'Included', 'Included', 'Included'],
  ['Buyer questions and purchase friction', 'Included', 'Included', 'Included'],
  ['Copy suggestions and message match', 'Core', 'Expanded', 'Expanded'],
  ['Competitor workspace', '—', 'Included', 'Included'],
  ['Monthly audit units', '50', '250', '1,000'],
  ['Multi-client workflow', '—', 'Projects', 'Agency-focused'],
];

export default function PricingPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState('');
  const [authState, setAuthState] = useState<'checking' | 'signed-in' | 'signed-out'>('checking');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me', { cache: 'no-store', credentials: 'same-origin' })
      .then(response => { if (!cancelled) setAuthState(response.ok ? 'signed-in' : 'signed-out'); })
      .catch(() => { if (!cancelled) setAuthState('signed-out'); });
    return () => { cancelled = true; };
  }, []);

  async function checkout(planId: string) {
    setError('');
    setLoading(planId);
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      const data = await response.json();
      if (response.status === 401) {
        setAuthState('signed-out');
        setError('Your session could not be verified for checkout. This page has not logged you out. Sign in again, then return to pricing to continue.');
        setLoading('');
        return;
      }
      if (!response.ok) throw new Error(data.message || data.error || 'Checkout is not available right now.');
      if (!data.url) throw new Error('The payment provider did not return a checkout URL.');
      window.location.href = data.url;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Checkout is not available right now.');
      setLoading('');
    }
  }

  return <main className="pricing-page">
    <SessionKeepAlive />
    <header className="site-nav">
      <Brand />
      <nav className="nav-links" aria-label="Pricing navigation"><Link href="/#capabilities">Capabilities</Link><Link href="/#how-it-works">How it works</Link><Link href="/security">Security</Link></nav>
      <div className="nav-actions">{authState === 'signed-in' ? <Link className="nav-signin" href="/dashboard">Workspace</Link> : <Link className="nav-signin" href="/auth?mode=login&next=/pricing">Sign in</Link>}{authState === 'signed-in' ? <Link href="/dashboard" className="button button-primary button-small">Open dashboard ↗</Link> : <Link href="/auth?next=/pricing" className="button button-primary button-small">Create account ↗</Link>}</div>
    </header>
    <section className="pricing-hero">
      <div className="eyebrow">CLEAR PLANS · NO PUBLIC LIFETIME DEAL</div>
      <h1>Choose the depth of work<br/><span>your team needs.</span></h1>
      <p>Start with evidence-backed audits. Scale into repeatable optimization workflows as your team, store portfolio and audit volume grow. Prices are shown in USD per month.</p>
      <div className="pricing-promise"><span>✓</span> No invented analytics. No guaranteed conversion lifts. No hidden claims about private data.</div><p className="pricing-trial-note">Start with a 7-day trial. No card is requested when you create an account.</p>
    </section>
    {error && <div className="error-box pricing-error" role="alert">{error} {authState === 'signed-out' && <Link href="/auth?mode=login&next=/pricing" style={{textDecoration:'underline',fontWeight:700}}>Sign in to continue</Link>}</div>}
    <section className="pricing-cards" aria-label="Subscription plans">
      {plans.map(plan => <article className={`pricing-card ${plan.popular ? 'pricing-card-featured' : ''}`} key={plan.id}>
        {plan.popular && <div className="pricing-ribbon">BEST FIT FOR GROWING TEAMS</div>}
        <div className="pricing-card-inner">
          <div className="pricing-plan-name">{plan.name}</div>
          <h2>{plan.price}<span>{plan.unit}</span></h2>
          <p className="pricing-audience">{plan.audience}</p>
          <p className="pricing-description">{plan.description}</p>
          <button className={plan.popular ? 'button button-primary pricing-cta' : 'button button-secondary pricing-cta'} onClick={() => checkout(plan.id)} disabled={Boolean(loading)}>
            {loading === plan.id ? 'Opening secure checkout…' : `Choose ${plan.name}`} <span aria-hidden="true">→</span>
          </button>
          <div className="pricing-feature-heading">WHAT’S INCLUDED</div>
          <ul>{plan.features.map(feature => <li key={feature}><span>✓</span>{feature}</li>)}</ul>
        </div>
      </article>)}
    </section>
    <section className="custom-plan">
      <div><div className="eyebrow">CUSTOM / ENTERPRISE</div><h2>Need a tailored operating model?</h2><p>For larger portfolios, bespoke reporting requirements, governance reviews, authorized data integrations or a custom rollout, discuss scope before committing. Availability depends on technical feasibility and agreed requirements.</p></div>
      <a className="button button-secondary" href="mailto:wisdomfrankceo@gmail.com?subject=PageFix%20AI%20Custom%20Plan">Discuss a custom plan ↗</a>
    </section>
    <section className="pricing-comparison">
      <div className="eyebrow">PLAN COMPARISON</div><h2>Know what you’re paying for.</h2>
      <div className="comparison-table-wrap"><table><thead><tr><th>Capability</th><th>Starter · $49</th><th>Growth · $149</th><th>Agency · $399</th></tr></thead><tbody>{matrix.map(row => <tr key={row[0]}>{row.map((cell,i) => i===0 ? <th key={cell} scope="row">{cell}</th> : <td key={cell}>{cell}</td>)}</tr>)}</tbody></table></div>
      <p className="pricing-footnote">“Included” describes the product workflow currently available or the stated plan allowance; it does not imply access to private analytics without an authorized connection. Custom, future and provider-dependent capabilities are never represented as live until implemented and verified.</p>
    </section>
    <section className="pricing-faq">
      <div className="eyebrow">COMMON QUESTIONS</div><h2>Clear expectations from day one.</h2>
      <details><summary>Can PageFix see my revenue, conversion rate or customer behaviour from a public URL?</summary><p>No. Public-page inspection can identify observable page-level evidence and possible risks. Private business metrics require an authorized data connection and must not be guessed.</p></details>
      <details><summary>Does PageFix guarantee more sales or higher rankings?</summary><p>No. It helps identify and prioritize issues. Results depend on implementation, audience, traffic quality, offer, market and other factors.</p></details>
      <details><summary>Can I request a custom plan?</summary><p>Yes. Contact the team to discuss scope, data access, security requirements and the integrations you need. Custom functionality is subject to feasibility and agreement.</p></details>
      <details><summary>Is checkout available now?</summary><p>Checkout requires the payment provider&apos;s production credentials and successful server-side transaction verification. If checkout is unavailable, no payment should be assumed to have succeeded.</p></details>
    </section>
    <footer className="site-footer"><Brand className="brand-footer" /><p>Evidence-led website diagnostics. Clear limits. Practical fixes.</p><div><Link href="/privacy">Privacy</Link><Link href="/security">Security</Link><Link href="/auth">Account</Link><a href="mailto:wisdomfrankceo@gmail.com">Contact</a></div><small>© {new Date().getFullYear()} PageFix AI. Pricing is in USD. Business outcomes are not guaranteed.</small></footer>
  </main>;
}
