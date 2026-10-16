import Link from 'next/link';

const capabilities = [
  { number: '01', title: 'Product Page Intelligence', body: 'Review visible product information, pricing clarity, primary actions, shipping and returns language, trust cues and unanswered buyer questions.' },
  { number: '02', title: 'Buyer Objection Intelligence', body: 'Identify purchase questions that are not observed in the captured page, such as fit, compatibility, delivery, returns and what is included.' },
  { number: '03', title: 'Commerce Friction Intelligence', body: 'Surface observable friction across page structure, links, content hierarchy, mobile presentation and the path to the next action.' },
  { number: '04', title: 'Message Match', body: 'Compare a supplied campaign promise with the landing page content to identify wording or offer mismatches that deserve review.' },
  { number: '05', title: 'Fix Intelligence', body: 'Turn supported findings into specific remediation steps and optional copy suggestions, without inventing customer data or outcomes.' },
  { number: '06', title: 'Verification & Rechecks', body: 'Inspect the page again after a change and compare the new observation with the prior audit instead of silently overwriting history.' },
];

const workflow = [
  { title: 'Inspect', body: 'Capture the public page at supported viewports and collect browser-visible content and technical signals.' },
  { title: 'Separate evidence from inference', body: 'Make clear what was directly observed, what is an inferred risk, what is a hypothesis and what is a recommendation.' },
  { title: 'Prioritize the next fix', body: 'Review severity, confidence, implementation effort and the evidence behind each recommendation.' },
  { title: 'Recheck and learn', body: 'Run a fresh inspection, preserve audit history and verify only what the new capture can actually establish.' },
];

const audiences = [
  { title: 'E-commerce operators', body: 'Improve the clarity of product pages, key buying details, trust information and next steps.' },
  { title: 'SaaS and landing-page teams', body: 'Review above-the-fold messaging, page structure, call-to-action clarity and the match between a promise and its destination.' },
  { title: 'Agencies and consultants', body: 'Standardize page inspections, keep evidence visible and make remediation discussions more concrete across projects.' },
];

export default function HomePage() {
  return <main className="marketing">
    <header className="site-nav">
      <Link href="/" className="brand" aria-label="PageFix AI home">PageFix<span>AI</span></Link>
      <nav className="nav-links" aria-label="Main navigation"><a href="#capabilities">Platform</a><a href="#product-system">Features</a><a href="#how-it-works">How it works</a><a href="#trust">Evidence standard</a><Link href="/compare">Compare tools</Link><Link href="/resources">Guides</Link><Link href="/partners/affiliate">Partners</Link><Link href="/pricing">Pricing</Link></nav>
      <div className="nav-actions"><Link href="/auth?mode=login" className="nav-signin">Sign in</Link><Link href="/auth" className="button button-primary button-small">Start an audit ↗</Link></div>
    </header>

    <section className="hero-section">
      <div className="hero-copy">
        <div className="eyebrow"><span className="status-dot" /> COMMERCE INTELLIGENCE & REMEDIATION</div>
        <h1>Find what’s holding your store back. <span>Fix it. Verify it.</span></h1>
        <p className="hero-description">PageFix AI inspects product pages, offers, landing pages and advertising-to-page journeys. It shows sellers evidence-backed problems, explains buyer-facing risks, gives practical fixes and helps verify what changed.</p>
        <div className="hero-actions"><Link href="/auth" className="button button-primary">Create your workspace <span>→</span></Link><Link href="/pricing" className="button button-secondary">Explore plans</Link></div>
        <div className="hero-proof"><div className="proof-mark">✓</div><p><strong>Evidence before opinions.</strong><br/>No fabricated analytics, reviews, conversion lifts or customer behaviour.</p></div>
      </div>
      <div className="product-preview" aria-label="Illustrative PageFix audit report preview">
        <div className="preview-window-bar"><div className="window-dots"><i/><i/><i/></div><span>PAGEFIX / AUDIT OVERVIEW</span><span className="preview-live"><i/> REPORT VIEW</span></div>
        <div className="preview-content">
          <div className="preview-heading"><div><div className="preview-kicker">REPORT WORKSPACE</div><h2>Evidence & recommended fixes</h2><p>Illustrative interface · not customer data</p></div><span className="preview-pill">Traceable</span></div>
          <div className="preview-stats"><div><span>Observation type</span><strong>Page-level evidence</strong><small>Visible to the browser</small></div><div><span>Review approach</span><strong>Desktop + mobile</strong><small>Where capture is supported</small></div></div>
          <div className="preview-list-title"><span>EXAMPLE FINDING TYPES</span><span>REVIEW BY PRIORITY</span></div>
          <article className="preview-finding"><div className="finding-icon finding-high">!</div><div><strong>Primary action needs review</strong><p>Check whether the next step is clear and discoverable.</p><span className="preview-tag tag-high">Potential friction</span></div><span className="finding-arrow">↗</span></article>
          <article className="preview-finding"><div className="finding-icon finding-medium">?</div><div><strong>Buyer question not observed</strong><p>Review shipping, returns, compatibility or what is included.</p><span className="preview-tag tag-medium">Evidence gap</span></div><span className="finding-arrow">↗</span></article>
          <div className="preview-note"><span>ⓘ</span><p>Example interface only. No live business result or fabricated performance metric is shown.</p></div>
        </div>
      </div>
    </section>

    <section className="trust-strip"><span>THE PAGEFIX STANDARD</span><div><b>01</b> Observable evidence</div><div><b>02</b> Honest confidence</div><div><b>03</b> Practical remediation</div><div><b>04</b> Verifiable rechecks</div></section>

    <section className="proof-section" aria-labelledby="proof-heading">
      <div className="proof-intro"><div className="eyebrow">PROOF YOU CAN INSPECT</div><h2 id="proof-heading">Trust the method.<br/><span>Inspect the evidence.</span></h2><p>We do not substitute invented case studies or made-up conversion lifts for proof. Here is what PageFix is designed to show in a report—and what it will never pretend to know from a public URL alone.</p><Link href="/methodology" className="text-link">Read our evidence standard →</Link></div>
      <div className="proof-cards">
        <article><span className="proof-card-index">01 / OBSERVED</span><h3>What the page shows</h3><p>Captured titles, headings, visible copy, links, product details and page elements—subject to what the website allows the inspection to access.</p><small>Report label: Directly Observed Evidence</small></article>
        <article><span className="proof-card-index">02 / INTERPRETED</span><h3>What may create friction</h3><p>Potential unanswered buyer questions, unclear next steps or mismatches that deserve human review—not a claim that a customer actually abandoned.</p><small>Report label: Inferred Risk or Hypothesis</small></article>
        <article><span className="proof-card-index">03 / ACTIONABLE</span><h3>What to fix and recheck</h3><p>Specific implementation guidance, a stated verification objective and a fresh inspection to see whether the observable issue remains.</p><small>Report label: Recommendation</small></article>
      </div>
      <div className="proof-footnote">Product interface previews are illustrative. PageFix does not publish customer testimonials, performance statistics or case-study outcomes unless they are genuine, authorized and verifiable.</div>
    </section>

    <section className="resource-cta-strip"><div><div className="eyebrow">MAKE AN INFORMED CHOICE</div><h2>Compare PageFix with the tools you already use.</h2><p>See where page-level friction diagnosis fits alongside SEO crawlers, speed testing and visitor-behaviour analytics.</p></div><div className="resource-cta-actions"><Link href="/compare" className="button button-primary">Compare tools →</Link><Link href="/resources" className="button button-secondary">Read practical guides</Link></div></section>

    <section className="section-block" id="capabilities">
      <div className="section-intro"><div className="eyebrow">A PRACTICAL DIAGNOSTIC WORKFLOW</div><h2>More than an audit score.<br/><span>A path from finding to fix.</span></h2><p>PageFix is designed for teams that need to know what the captured page actually reveals, what may be getting in the way and what deserves attention next.</p></div>
      <div className="capability-grid capability-grid-six">{capabilities.map(item=><article className="capability-card" key={item.number}><div className="capability-number">{item.number}</div><h3>{item.title}</h3><p>{item.body}</p><div className="capability-line"/></article>)}</div>
    </section>

    <section className="workflow-section" id="how-it-works"><div className="workflow-header"><div><div className="eyebrow eyebrow-light">DETECT → DIAGNOSE → FIX → VERIFY</div><h2>A workflow you can<br/>trace and trust.</h2></div><p>Each finding should show its evidence and limits. Recommendations should be actionable. A recheck should report only what the fresh inspection can establish.</p></div><div className="workflow-grid">{workflow.map((item,index)=><article className="workflow-step" key={item.title}><span className="workflow-index">0{index+1}</span><div className="workflow-connector"/><h3>{item.title}</h3><p>{item.body}</p></article>)}</div></section>

    <section className="section-block audience-section"><div className="section-intro"><div className="eyebrow">BUILT FOR PEOPLE RESPONSIBLE FOR THE PAGE</div><h2>Make better-informed<br/><span>website decisions.</span></h2></div><div className="audience-grid">{audiences.map((item,index)=><article key={item.title}><span>{['↗','⌘','▦'][index]}</span><h3>{item.title}</h3><p>{item.body}</p></article>)}</div></section>


    <section className="product-system-section" id="product-system">
      <div className="product-system-inner">
        <div className="eyebrow">THE PAGEFIX COMMERCE SYSTEM</div>
        <h2>One connected workflow.<br/><span>Not another pile of audit reports.</span></h2>
        <p className="product-system-lead">PageFix is designed to connect inspection, buyer decision intelligence, claim consistency, practical fixes and verification. Individual sellers can use the core workflow independently; teams and agencies can extend it across products and clients.</p>
        <div className="product-system-grid">
          <article className="system-card system-card-featured"><span className="system-number">01</span><h3>Commerce Inspection</h3><p>Inspect public product pages, landing pages, visible content, page structure and supported desktop/mobile captures. Every report states what was and was not inspected.</p><ul><li>Product and landing-page intelligence</li><li>Visual evidence and page anatomy</li><li>Inspection coverage and limitations</li></ul></article>
          <article className="system-card"><span className="system-number">02</span><h3>Buyer Decision Intelligence</h3><p>Review the information shoppers may need to decide, with rules adapted to the product category rather than a universal checklist.</p><ul><li>Buyer objection coverage</li><li>Product information completeness</li><li>Offer clarity and trust information</li></ul></article>
          <article className="system-card"><span className="system-number">03</span><h3>Claim & Contradiction Intelligence</h3><p>Compare claims across ads, product descriptions, specifications and visible policy content. Show both sides of a suspected discrepancy.</p><ul><li>Ad-to-page message match</li><li>Specification and offer consistency</li><li>Promise Ledger foundation</li></ul></article>
          <article className="system-card"><span className="system-number">04</span><h3>Commerce Risk Intelligence</h3><p>Surface clarity, trust, usability and post-purchase expectation risks without pretending that a public page proves actual customer behaviour.</p><ul><li>Mobile and page-friction review</li><li>Category-aware expectation gaps</li><li>Confidence and uncertainty labels</li></ul></article>
          <article className="system-card"><span className="system-number">05</span><h3>Fix Center</h3><p>Turn findings into a manageable work queue, with seller-friendly instructions and copy suggestions grounded in known product facts.</p><ul><li>Prioritised actions and status history</li><li>Nontechnical, operator and developer guidance</li><li>Fix attempts separated from verification</li></ul></article>
          <article className="system-card"><span className="system-number">06</span><h3>Verification & Rechecks</h3><p>Run a fresh inspection, compare it with prior evidence and record whether the issue was resolved, remains, reappeared or could not be verified.</p><ul><li>Versioned inspection history</li><li>Before-and-after evidence</li><li>Clear verification outcomes</li></ul></article>
          <article className="system-card"><span className="system-number">07</span><h3>Store Intelligence</h3><p>Build a store-level view across products and pages so sellers can identify recurring patterns instead of treating every audit as isolated.</p><ul><li>Recurring issue groups</li><li>Prioritised multi-product queue</li><li>Historical progress summaries</li></ul></article>
          <article className="system-card"><span className="system-number">08</span><h3>Commercial Impact Analysis</h3><p>Use seller-provided figures to model transparent scenarios. Separate illustrative estimates from measured business outcomes.</p><ul><li>Explicit inputs and assumptions</li><li>Sensitivity analysis</li><li>No invented revenue-loss figures</li></ul></article>
          <article className="system-card"><span className="system-number">09</span><h3>Reports & Sharing</h3><p>Create inspection, fix-plan and verification reports that show evidence, coverage, limitations and changes over time.</p><ul><li>Evidence-linked reporting</li><li>Client-ready summaries</li><li>Controlled, revocable sharing</li></ul></article>
          <article className="system-card"><span className="system-number">10</span><h3>Integrations & Controlled Actions</h3><p>Build toward authorised read-only commerce and analytics connections first, followed by approved changes only where permissions and rollback support exist.</p><ul><li>Seller-authorised data access</li><li>Least-privilege permissions</li><li>Approval and audit logging</li></ul></article>
          <article className="system-card"><span className="system-number">11</span><h3>Seller, Team & Agency Workspaces</h3><p>Keep the individual seller experience simple while supporting multiple products, collaborators and client-separated workspaces.</p><ul><li>Seller-first core workflow</li><li>Multi-client agency structure</li><li>Role-based access as supported</li></ul></article>
          <article className="system-card"><span className="system-number">12</span><h3>Governance & Measurement</h3><p>Protect trust with access controls, activity history, evidence provenance and outcome measurement only when reliable data is available.</p><ul><li>Finding and change audit trail</li><li>Data provenance and privacy controls</li><li>Experimentation as a later-stage capability</li></ul></article>
        </div>
        <div className="system-footnote"><strong>Important:</strong> This describes the product architecture and capability roadmap. Some advanced capabilities require further implementation, verified data access or third-party integrations; PageFix will identify those limits rather than present planned functionality as live.</div>
      </div>
    </section>

    <section className="category-intelligence-section">
      <div className="category-intelligence-inner">
        <div><div className="eyebrow">CONTEXT-AWARE, NOT ONE-SIZE-FITS-ALL</div><h2>Different products.<br/><span>Different buyer questions.</span></h2><p>PageFix evaluates what is relevant to the product and buying context. It does not treat every possible checklist item as mandatory for every seller.</p></div>
        <div className="category-table">
          <div className="category-row category-head"><span>SELLER CATEGORY</span><span>WHAT PAGEFIX CAN REVIEW</span></div>
          <div className="category-row"><strong>Clothing & accessories</strong><span>Size and fit guidance, material details, care instructions, colour representation and visible variants.</span></div>
          <div className="category-row"><strong>Electronics</strong><span>Specifications, compatibility, power requirements, included accessories and visible warranty terms.</span></div>
          <div className="category-row"><strong>Furniture & home</strong><span>Dimensions, materials, assembly requirements, delivery conditions and installation clarity.</span></div>
          <div className="category-row"><strong>Beauty & skincare</strong><span>Ingredients, directions, suitability information, relevant warnings and substantiation of visible claims.</span></div>
          <div className="category-row"><strong>Digital products & SaaS</strong><span>Deliverables, supported platforms, prerequisites, access conditions, onboarding and commercial terms.</span></div>
          <div className="category-row"><strong>B2B products</strong><span>Use cases, implementation requirements, integrations, service conditions and support expectations.</span></div>
        </div>
      </div>
    </section>

    <section className="impact-section">
      <div className="impact-inner">
        <div className="eyebrow eyebrow-light">COMMERCIAL CONTEXT WITHOUT FICTION</div>
        <h2>Show the risk.<br/><span>Never invent the revenue.</span></h2>
        <p>PageFix separates what a page visibly shows from what might happen and what a seller's own business data can establish.</p>
        <div className="impact-levels">
          <article><span>LEVEL 01</span><h3>Identified risk</h3><p>Explain the evidence-backed issue and its plausible relevance to a buyer decision. No financial estimate required.</p></article>
          <article><span>LEVEL 02</span><h3>Scenario analysis</h3><p>Use seller-provided traffic, conversion, order value or margin figures with explicit assumptions. Label outputs as illustrative scenarios.</p></article>
          <article><span>LEVEL 03</span><h3>Measured outcome</h3><p>Compare authorised analytics or transaction data with appropriate caveats. Do not claim causation from a simple before-and-after comparison.</p></article>
        </div>
      </div>
    </section>
\n    <section className="detail-section"><div className="detail-heading"><div className="eyebrow">WHAT THE REPORT SHOULD CONTAIN</div><h2>Every finding needs a reason<br/>and a next step.</h2><p>Findings are designed around evidence and action, not unsupported scores or inflated claims.</p></div><div className="detail-grid">{[['Classification','Directly Observed Evidence, Inferred Risk, Hypothesis or Recommendation.'],['Evidence location','The captured text, page element, URL, metadata or other observable signal behind the finding.'],['Why it matters','A plain-language explanation of the possible consequence, without claiming a measured conversion impact.'],['Confidence & unknowns','A clear confidence level and the information the audit cannot establish from a public page.'],['Implementation guidance','Concrete steps and optional copy suggestions tied to the specific issue.'],['Verification objective','What should be inspected again after the fix and what would count as resolved, improved or unverified.']].map(([title,body])=><article key={title}><span>✓</span><h3>{title}</h3><p>{body}</p></article>)}</div></section>

    <section className="honesty-section" id="trust"><div className="honesty-symbol">i</div><div><div className="eyebrow">EVIDENCE, PRIVACY AND SECURITY</div><h2>A public-page audit cannot see private business metrics.</h2><p>Revenue, margins, traffic quality, conversion rates, customer lifetime value, actual abandonment and private customer records require authorized data connections. PageFix must not guess these values. Audit websites you are authorized to inspect, keep credentials server-side and treat every finding according to its actual evidence.</p><div className="trust-links"><Link href="/privacy">Read privacy information →</Link><Link href="/security">Read security practices →</Link></div></div></section>

    <section className="faq-section"><div className="eyebrow">BEFORE YOU START</div><h2>Clear expectations. Useful output.</h2><details><summary>Will PageFix guarantee more sales or higher search rankings?</summary><p>No. PageFix identifies observable page issues and recommendations. Commercial outcomes depend on many factors outside a public-page audit.</p></details><details><summary>Does it connect to my private analytics automatically?</summary><p>No. Private data must be connected intentionally through an authorized integration. Without it, PageFix reports only what it can observe.</p></details><details><summary>What can I audit?</summary><p>Public product pages, ecommerce pages and landing pages you are authorized to inspect. Some websites may block automated browsers or restrict access.</p></details><details><summary>How do I choose a plan?</summary><p>Starter is $49/month, Growth is $149/month and Agency is $399/month. Custom requirements can be discussed with the team.</p></details></section>

    <section className="final-cta"><div className="eyebrow eyebrow-light">START WITH THE PAGE, NOT A GUESS</div><h2>Know what deserves attention<br/>before you ship another change.</h2><p>Create a workspace, inspect a public page and review the evidence behind the recommendations.</p><div className="final-cta-actions"><Link href="/auth" className="button button-light">Create your workspace →</Link><Link href="/pricing" className="button button-ghost-light">Compare plans</Link></div></section>

    <footer className="site-footer"><Link href="/" className="brand brand-footer">PageFix<span>AI</span></Link><p>Evidence-led website diagnostics. Clear limits. Practical fixes.</p><div><Link href="/pricing">Pricing</Link><Link href="/compare">Compare tools</Link><Link href="/resources">Resources</Link><Link href="/partners/affiliate">Affiliate program</Link><Link href="/referrals">Referral program</Link><Link href="/methodology">Evidence standard</Link><Link href="/privacy">Privacy</Link><Link href="/security">Security</Link><Link href="/auth">Account</Link><a href="mailto:wisdomfrankceo@gmail.com">Contact</a></div><small>© {new Date().getFullYear()} PageFix AI. Audit findings describe observable evidence and do not guarantee commercial outcomes.</small></footer>
  </main>;
}
