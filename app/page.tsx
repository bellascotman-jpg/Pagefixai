import Link from 'next/link';

const capabilities = [
  { number: '01', title: 'Technical integrity', body: 'Inspect visible metadata, headings, canonical signals, structured data, image alternatives and key page elements.' },
  { number: '02', title: 'Buyer decision clarity', body: 'Surface observable gaps in product details, purchase actions, shipping, returns, pricing and trust information.' },
  { number: '03', title: 'Evidence-linked fixes', body: 'See what was observed, why it may matter, how to correct it and what to inspect again after the change.' },
];

const workflow = [
  { title: 'Inspect', body: 'Render the public page on desktop and mobile. Capture the evidence the browser can actually see.' },
  { title: 'Diagnose', body: 'Apply deterministic checks and evidence-grounded analysis to identify issues and plausible risks.' },
  { title: 'Prioritize', body: 'Separate urgent technical problems from improvements that need human judgment.' },
  { title: 'Verify', body: 'Run a fresh inspection after changes. Keep the original audit so progress is traceable.' },
];

export default function HomePage() {
  return (
    <main className="marketing">
      <header className="site-nav">
        <Link href="/" className="brand" aria-label="PageFix AI home">PageFix<span>AI</span></Link>
        <nav className="nav-links" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#capabilities">Capabilities</a>
          <Link href="/pricing">Pricing</Link>
        </nav>
        <div className="nav-actions">
          <Link href="/auth?mode=login" className="nav-signin">Sign in</Link>
          <Link href="/auth" className="button button-primary button-small">Start an audit <span aria-hidden="true">↗</span></Link>
        </div>
      </header>

      <section className="hero-section">
        <div className="hero-copy">
          <div className="eyebrow"><span className="status-dot" /> EVIDENCE-LED WEBSITE INTELLIGENCE</div>
          <h1>Find what&apos;s breaking the <span>customer journey.</span></h1>
          <p className="hero-description">PageFix AI inspects public product pages and landing pages, explains observable friction, and turns supported findings into practical fixes you can verify.</p>
          <div className="hero-actions">
            <Link href="/auth" className="button button-primary">Audit your website <span aria-hidden="true">→</span></Link>
            <a href="#how-it-works" className="button button-secondary">See how it works</a>
          </div>
          <div className="hero-proof">
            <div className="proof-mark">✓</div>
            <p><strong>Evidence before opinions.</strong><br />No fabricated analytics or guaranteed conversion lifts.</p>
          </div>
        </div>

        <div className="product-preview" aria-label="Illustrative PageFix audit report preview">
          <div className="preview-window-bar"><div className="window-dots"><i /><i /><i /></div><span>PAGEFIX / AUDIT OVERVIEW</span><span className="preview-live"><i /> REPORT VIEW</span></div>
          <div className="preview-content">
            <div className="preview-heading"><div><div className="preview-kicker">AUDIT SUMMARY</div><h2>Storefront review</h2><p>Example report layout · illustrative data</p></div><span className="preview-pill">Evidence-led</span></div>
            <div className="preview-stats">
              <div><span>Evidence captured</span><strong>Page-level</strong><small>Browser observations</small></div>
              <div><span>Viewports</span><strong>Desktop + mobile</strong><small>Two inspection views</small></div>
            </div>
            <div className="preview-list-title"><span>EXAMPLE FINDING CARDS</span><span>PRIORITIZED</span></div>
            <article className="preview-finding"><div className="finding-icon finding-high">!</div><div><strong>Primary action is unclear</strong><p>Check whether the next commercial step is identifiable.</p><span className="preview-tag tag-high">Review first</span></div><span className="finding-arrow">↗</span></article>
            <article className="preview-finding"><div className="finding-icon finding-medium">↗</div><div><strong>Product information gap</strong><p>Review whether key buyer questions are answered.</p><span className="preview-tag tag-medium">Improve next</span></div><span className="finding-arrow">↗</span></article>
            <div className="preview-note"><span>ⓘ</span><p>This is a design preview, not a live audit or a real customer result.</p></div>
          </div>
        </div>
      </section>

      <section className="trust-strip" aria-label="Product principles">
        <span>BUILT AROUND FOUR PRINCIPLES</span>
        <div><b>01</b> Observable evidence</div><div><b>02</b> Clear limitations</div><div><b>03</b> Practical remediation</div><div><b>04</b> Verifiable rechecks</div>
      </section>

      <section className="section-block" id="capabilities">
        <div className="section-intro"><div className="eyebrow">FROM OBSERVATION TO ACTION</div><h2>Not another score.<br /><span>A clearer path to the fix.</span></h2><p>PageFix is designed to help ecommerce teams and web professionals understand what a public page reveals, what may be getting in the way, and what to do next.</p></div>
        <div className="capability-grid">{capabilities.map(item => <article className="capability-card" key={item.number}><div className="capability-number">{item.number}</div><h3>{item.title}</h3><p>{item.body}</p><div className="capability-line" /></article>)}</div>
      </section>

      <section className="workflow-section" id="how-it-works">
        <div className="workflow-header"><div><div className="eyebrow eyebrow-light">A TRACEABLE WORKFLOW</div><h2>From page inspection<br />to a verified change.</h2></div><p>Every conclusion should have a source. Every recommendation should give you a next step. Every recheck should reflect what the system can actually observe.</p></div>
        <div className="workflow-grid">{workflow.map((item, index) => <article className="workflow-step" key={item.title}><span className="workflow-index">0{index + 1}</span><div className="workflow-connector" /><h3>{item.title}</h3><p>{item.body}</p></article>)}</div>
      </section>

      <section className="section-block audience-section">
        <div className="section-intro"><div className="eyebrow">MADE FOR PEOPLE WHO SHIP WEBSITES</div><h2>Useful for the people<br /><span>responsible for the page.</span></h2></div>
        <div className="audience-grid"><article><span>↗</span><h3>Store owners</h3><p>Find visible product-page issues and improve the information customers use to make decisions.</p></article><article><span>⌘</span><h3>Growth & SEO teams</h3><p>Review technical signals and page-level issues without pretending to know private analytics.</p></article><article><span>▦</span><h3>Agencies & consultants</h3><p>Build a more repeatable inspection and remediation workflow across client websites.</p></article></div>
      </section>

      <section className="honesty-section"><div className="honesty-symbol">i</div><div><div className="eyebrow">A NECESSARY DISTINCTION</div><h2>Evidence is not the same as business performance.</h2><p>A public-page audit cannot reveal private revenue, traffic quality, conversion rates, margins, customer lifetime value or actual checkout abandonment. Those require authorized data connections. PageFix labels observations and hypotheses honestly instead of inventing numbers.</p></div></section>

      <section className="final-cta"><div className="eyebrow eyebrow-light">MAKE THE NEXT FIX A BETTER-INFORMED ONE</div><h2>Start with what your page<br />actually shows.</h2><p>Inspect a public page, review the evidence, and decide what deserves attention.</p><Link href="/auth" className="button button-light">Create your workspace <span aria-hidden="true">→</span></Link></section>

      <footer className="site-footer"><Link href="/" className="brand brand-footer">PageFix<span>AI</span></Link><p>Evidence-led website diagnostics. Clear limits. Practical fixes.</p><div><Link href="/pricing">Pricing</Link><Link href="/auth">Sign in / Create account</Link><a href="mailto:support@pagefixai.com">Contact</a></div><small>© {new Date().getFullYear()} PageFix AI. Audit findings describe observable evidence and are not guarantees of commercial outcomes.</small></footer>
    </main>
  );
}
