import Link from 'next/link';

const terms = [
  { title: '25% recurring commission', body: 'Earn 25% of eligible, verified subscription payments from customers you refer while they remain paying customers and comply with program terms.' },
  { title: 'Instant activation', body: 'Every registered PageFix user can activate a personal referral account immediately. No application, waiting period or manual approval is required.' },
  { title: '30-day attribution', body: 'A first-party referral cookie attributes eligible signups for 30 days. Self-referrals, duplicate accounts and fraudulent activity are excluded.' },
  { title: 'Clear payout rules', body: 'Commissions are recorded after verified eligible payments. The minimum payout balance is $50; payouts are reviewed monthly and sent manually for now.' },
];

export default function AffiliateProgramPage() {
  return <main className="marketing editorial-page">
    <header className="site-nav">
      <Link href="/" className="brand">PageFix<span>AI</span></Link>
      <nav className="nav-links" aria-label="Main navigation"><Link href="/compare">Compare tools</Link><Link href="/resources">Guides</Link><Link href="/pricing">Pricing</Link></nav>
      <div className="nav-actions"><Link href="/auth?mode=login" className="nav-signin">Sign in</Link><Link href="/auth?mode=signup&next=/referrals" className="button button-primary button-small">Activate referrals ↗</Link></div>
    </header>
    <section className="editorial-hero partner-hero">
      <div className="eyebrow">PAGEFIX AI · CUSTOMER REFERRALS</div>
      <h1>Share PageFix AI.<br/><span>Earn 25% on eligible payments.</span></h1>
      <p>Creators, ecommerce operators, consultants, agencies and everyday users can recommend PageFix AI and earn commission when referred customers make eligible verified payments.</p>
      <div className="partner-hero-stats"><div><b>25%</b><span>eligible recurring commission</span></div><div><b>30 days</b><span>referral attribution</span></div><div><b>$50</b><span>minimum payout balance</span></div></div>
      <div className="partner-actions"><Link href="/auth?mode=signup&next=/referrals" className="button button-primary">Create account & activate →</Link><Link href="/auth?mode=login&next=/referrals" className="button button-secondary">I already have an account</Link></div>
      <p className="application-note">Already registered? Open your referral dashboard from your signed-in workspace. Your personal link is created automatically.</p>
    </section>
    <section className="partner-content">
      <div className="section-intro"><div className="eyebrow">SIMPLE, TRANSPARENT TERMS</div><h2>Start sharing without an approval queue.</h2><p>Your referral dashboard is available to every registered user. Commission tracking and payouts remain subject to the rules below.</p></div>
      <div className="partner-terms-grid">{terms.map((term, i) => <article key={term.title}><span>{String(i+1).padStart(2,'0')}</span><h3>{term.title}</h3><p>{term.body}</p></article>)}</div>
      <div className="partner-disclosure"><h3>Promote responsibly</h3><p>Disclose that you may earn commission. Do not make unsupported claims about PageFix results, send spam, bid deceptively on trademarks, or refer yourself. Refunds and chargebacks can reverse related commissions.</p><Link href="/referrals" className="text-link">Go to referral dashboard →</Link></div>
    </section>
    <footer className="site-footer"><div className="footer-inner"><Link href="/" className="brand">PageFix<span>AI</span></Link><div><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/pricing">Pricing</Link></div><p>Evidence-led website diagnostics. No fabricated metrics or promised outcomes.</p></div></footer>
  </main>;
}
