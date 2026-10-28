import Link from "next/link";

const solutionItems = [
  "Product Page Intelligence", "Buyer Objection Intelligence", "Commerce Friction Intelligence",
  "Message Match", "Fix Intelligence", "Verification & Rechecks",
  "Ads Optimization", "Ad Creative", "Copywriting", "Customer Journey",
];
const integrationItems = ["Shopify", "WooCommerce", "Google Ads", "Meta Ads", "TikTok Ads", "GA4", "Klaviyo", "Search Console"];
const capabilities = [
  { number: "01", title: "Product Page Intelligence", body: "Review visible product information, pricing clarity, primary actions, shipping and returns language, trust cues and unanswered buyer questions." },
  { number: "02", title: "Buyer Objection Intelligence", body: "Identify purchase questions that are not observed in the captured page, such as fit, compatibility, delivery, returns and what is included." },
  { number: "03", title: "Commerce Friction Intelligence", body: "Surface observable friction across page structure, links, content hierarchy, mobile presentation and the path to the next action." },
  { number: "04", title: "Message Match", body: "Compare a supplied campaign promise with the landing page content to identify wording or offer mismatches that deserve review." },
  { number: "05", title: "Fix Intelligence", body: "Turn supported findings into specific remediation steps and optional copy suggestions, without inventing customer data or outcomes." },
  { number: "06", title: "Verification & Rechecks", body: "Inspect the page again after a change and compare the new observation with the prior audit instead of silently overwriting history." },
];
const proofItems = [
  { label: "01 / OBSERVED", title: "What the page shows", body: "Captured titles, headings, visible copy, links, product details and page elements—subject to what the website allows the inspection to access.", tag: "Directly observed" },
  { label: "02 / INFERRED", title: "What may deserve review", body: "Explain a plausible buyer-facing risk without presenting an interpretation as a measured customer outcome.", tag: "Inferred risk" },
  { label: "03 / UNKNOWN", title: "What a public page cannot tell you", body: "Revenue, margins, traffic quality, conversion rates and actual abandonment require authorized data connections.", tag: "Limits disclosed" },
];
const workflow = [
  { title: "Inspect", body: "Capture the public page at supported viewports and collect browser-visible content and technical signals." },
  { title: "Separate evidence from inference", body: "Make clear what was directly observed, what is an inferred risk, what is a hypothesis and what is a recommendation." },
  { title: "Prioritize the next fix", body: "Review severity, confidence, implementation effort and the evidence behind each recommendation." },
  { title: "Recheck and learn", body: "Run a fresh inspection, preserve audit history and verify only what the new capture can actually establish." },
];
const solutions = [
  { n: "01", title: "Ads Optimization", body: "Review whether the promise in an ad matches the page it lands on, spot wording and offer mismatches, and prioritise what to change using evidence rather than invented ROAS.", tag: "Ad-to-page message match" },
  { n: "02", title: "Ad Creative", body: "Get grounded creative angles and concept directions built from product facts that are actually visible on the page, not from made-up claims.", tag: "Grounded in visible product facts" },
  { n: "03", title: "Copywriting", body: "Generate alternative headlines, descriptions and product copy from available facts. Missing specifications stay placeholders for you to confirm.", tag: "Placeholders, never invented specs" },
  { n: "04", title: "Customer Journey", body: "Trace the path from ad click to product page to next action, and surface unanswered buyer questions and friction at each observable step.", tag: "Observable steps, honest limits" },
];
const system = [
  ["01", "Commerce Inspection", "Inspect public product pages, landing pages, visible content, page structure and supported desktop/mobile captures. Every report states what was and was not inspected."],
  ["02", "Buyer Decision Intelligence", "Review the information shoppers may need to decide, with rules adapted to the product category rather than a universal checklist."],
  ["03", "Claim & Contradiction Intelligence", "Compare claims across ads, product descriptions, specifications and visible policy content. Show both sides of a suspected discrepancy."],
  ["04", "Commerce Risk Intelligence", "Surface clarity, trust, usability and post-purchase expectation risks without pretending that a public page proves actual customer behaviour."],
  ["05", "Fix Center", "Turn findings into a manageable work queue, with seller-friendly instructions and copy suggestions grounded in known product facts."],
  ["06", "Verification & Rechecks", "Run a fresh inspection, compare it with prior evidence and record whether the issue was resolved, remains, reappeared or could not be verified."],
  ["07", "Store Intelligence", "Build a store-level view across products and pages so sellers can identify recurring patterns instead of treating every audit as isolated."],
  ["08", "Commercial Impact Analysis", "Use seller-provided figures to model transparent scenarios. Separate illustrative estimates from measured business outcomes."],
  ["09", "Reports & Sharing", "Create inspection, fix-plan and verification reports that show evidence, coverage, limitations and changes over time."],
  ["10", "Integrations & Controlled Actions", "Build toward authorised read-only commerce and analytics connections first, followed by approved changes only where permissions and rollback support exist."],
  ["11", "Seller, Team & Agency Workspaces", "Keep the individual seller experience simple while supporting multiple products, collaborators and client-separated workspaces."],
  ["12", "Governance & Measurement", "Protect trust with access controls, activity history, evidence provenance and outcome measurement only when reliable data is available."],
] as const;

function Mark({ children }: { children: React.ReactNode }) {
  return <span className="pfx-mark" aria-hidden="true">{children}</span>;
}

export function Nav() {
  return <header className="pfx-nav"><div className="pfx-nav-inner">
    <Link className="pfx-logo" href="/" aria-label="PageFix AI home"><span className="pfx-logo-mark">✓</span>PageFix<span>AI</span></Link>
    <nav className="pfx-nav-links" aria-label="Main navigation">
      <a href="#capabilities">Platform</a><a href="#product-system">Features</a><a href="#how-it-works">How it works</a><a href="#trust">Evidence standard</a>
      <Link href="/compare">Compare</Link><Link href="/resources">Guides</Link><Link href="/pricing">Pricing</Link>
    </nav>
    <div className="pfx-nav-actions"><Link href="/auth?mode=login">Sign in</Link><Link className="pfx-btn pfx-btn-red pfx-btn-small" href="/auth">Start an audit <span aria-hidden="true">↗</span></Link></div>
  </div></header>;
}

export function Hero() {
  return <section className="pfx-hero">
    <div className="pfx-hero-glow" aria-hidden="true" />
    <div className="pfx-hero-grid">
      <div className="pfx-hero-copy">
        <div className="pfx-eyebrow"><i /> COMMERCE INTELLIGENCE & REMEDIATION</div>
        <h1>Find what’s holding your store back. <em>Fix it. Verify it.</em></h1>
        <p className="pfx-lead">PageFix AI inspects product pages, offers, landing pages and advertising-to-page journeys. It shows sellers evidence-backed problems, explains buyer-facing risks, gives practical fixes and helps verify what changed.</p>
        <div className="pfx-actions"><Link className="pfx-btn pfx-btn-red" href="/auth">Create your workspace <span>→</span></Link><Link className="pfx-btn pfx-btn-outline" href="/pricing">Explore plans</Link></div>
        <div className="pfx-honesty"><Mark>✓</Mark><p><b>Evidence before opinions.</b><br/>No fabricated analytics, reviews, conversion lifts or customer behaviour.</p></div>
      </div>
      <div className="pfx-report" aria-label="Illustrative PageFix audit report preview">
        <div className="pfx-report-head"><span><i/> <i/> <i/></span><b>PAGEFIX / AUDIT OVERVIEW</b><small>REPORT VIEW</small></div>
        <div className="pfx-report-body"><div className="pfx-report-label">REPORT WORKSPACE</div><div className="pfx-report-title">Evidence & recommended fixes</div><p className="pfx-report-disclaimer">Illustrative interface · not customer data</p>
          <div className="pfx-report-stat-grid"><div><small>Observation type</small><b>Page-level evidence</b><span>Visible to the browser</span></div><div><small>Review approach</small><b>Desktop + mobile</b><span>Where capture is supported</span></div></div>
          <div className="pfx-report-label">EXAMPLE FINDING TYPES · REVIEW BY PRIORITY</div>
          <div className="pfx-finding"><span className="pfx-finding-icon">!</span><div><b>Primary action needs review</b><p>Check whether the next step is clear and discoverable.</p><small>Potential friction</small></div></div>
          <div className="pfx-finding"><span className="pfx-finding-icon pfx-finding-muted">?</span><div><b>Buyer question not observed</b><p>Review shipping, returns, compatibility or what is included.</p><small>Evidence gap</small></div></div>
          <div className="pfx-scanline" aria-hidden="true"/>
        </div>
        <p className="pfx-report-caption">Example interface only. No live business result or fabricated performance metric is shown.</p>
      </div>
    </div>
    <div className="pfx-strip"><b>BUILT AROUND EVIDENCE</b><div className="pfx-strip-track">{solutionItems.concat(solutionItems).map((item, i)=><span key={item+i}><i aria-hidden="true">✳</i>{item}</span>)}</div></div>
  </section>;
}

export function Strips() {
  return <section className="pfx-integrations"><div className="pfx-section-wrap"><div className="pfx-eyebrow">COMMERCE CONNECTIONS</div><h2>Work with the store you already run.</h2><div className="pfx-strip-track pfx-strip-track-static">{integrationItems.map((item, i)=><span key={item}><i aria-hidden="true">{["◈","◉","◌","✳","▷","⌁","◎","↗"][i]}</i>{item}</span>)}</div><p className="pfx-caption">Shopify and WooCommerce store integrations are available in the product where configured. Google Ads, Meta Ads, TikTok Ads, GA4, Klaviyo and Search Console are roadmap targets; availability depends on what is enabled in your workspace.</p></div></section>;
}

export function Proof() {
  return <section className="pfx-section pfx-proof" id="trust"><div className="pfx-section-wrap"><div className="pfx-eyebrow">PROOF YOU CAN INSPECT</div><h2>Trust the method. <em>Inspect the evidence.</em></h2><p className="pfx-section-lead">We do not substitute invented case studies or made-up conversion lifts for proof. Here is what PageFix is designed to show in a report—and what it will never pretend to know from a public URL alone.</p><div className="pfx-card-grid">{proofItems.map(x=><article className="pfx-card" key={x.label}><div className="pfx-card-label">{x.label}</div><h3>{x.title}</h3><p>{x.body}</p><span className="pfx-tag">{x.tag}</span></article>)}</div></div></section>;
}

export function Workflow() {
  return <section className="pfx-section pfx-workflow" id="how-it-works"><div className="pfx-section-wrap"><div className="pfx-eyebrow">DETECT → DIAGNOSE → FIX → VERIFY</div><h2>A workflow you can trace and trust.</h2><p className="pfx-section-lead">Each finding should show its evidence and limits. Recommendations should be actionable. A recheck should report only what the fresh inspection can establish.</p><div className="pfx-card-grid pfx-four">{workflow.map((x,i)=><article className="pfx-card pfx-step" key={x.title}><span className="pfx-step-num">0{i+1}</span><h3>{x.title}</h3><p>{x.body}</p></article>)}</div></div></section>;
}

export function Solutions() {
  return <section className="pfx-section" id="solutions"><div className="pfx-section-wrap"><div className="pfx-eyebrow">SOLUTIONS FOR E-COMMERCE BUSINESSES</div><h2>Ads, creative, copy and customer journeys. <em>One evidence trail.</em></h2><p className="pfx-section-lead">PageFix goes beyond page audits. It connects your advertising promise, your creative, your copy and the buyer’s journey, so every recommendation points back to something observable.</p><div className="pfx-card-grid pfx-four">{solutions.map(x=><article className="pfx-card" key={x.n}><div className="pfx-card-label">{x.n}</div><h3>{x.title}</h3><p>{x.body}</p><span className="pfx-tag">{x.tag}</span></article>)}</div></div></section>;
}

export function Steps() {
  return <section className="pfx-section pfx-step-section" id="capabilities"><div className="pfx-section-wrap"><div className="pfx-eyebrow">A PRACTICAL DIAGNOSTIC WORKFLOW</div><h2>More than an audit score. <em>A path from finding to fix.</em></h2><p className="pfx-section-lead">PageFix is designed for teams that need to know what the captured page actually reveals, what may be getting in the way and what deserves attention next.</p><div className="pfx-card-grid pfx-three">{capabilities.map(x=><article className="pfx-card" key={x.number}><div className="pfx-card-label">{x.number}</div><h3>{x.title}</h3><p>{x.body}</p></article>)}</div></div></section>;
}

export function Audiences() {
  const audiences = [
    ["↗","E-commerce operators","Improve the clarity of product pages, key buying details, trust information and next steps."],
    ["⌘","SaaS and landing-page teams","Review above-the-fold messaging, page structure, call-to-action clarity and the match between a promise and its destination."],
    ["▦","Agencies and consultants","Standardize page inspections, keep evidence visible and make remediation discussions more concrete across projects."],
  ];
  return <section className="pfx-section"><div className="pfx-section-wrap"><div className="pfx-eyebrow">BUILT FOR PEOPLE RESPONSIBLE FOR THE PAGE</div><h2>Make better-informed <em>website decisions.</em></h2><div className="pfx-card-grid pfx-three">{audiences.map(([icon,title,body])=><article className="pfx-card pfx-audience" key={title}><Mark>{icon}</Mark><h3>{title}</h3><p>{body}</p></article>)}</div></div></section>;
}

export function AuditTrail() {
  const entries = [
    ["01","Page title and primary heading","Captured from the inspected page","OBSERVED"],
    ["02","Primary action discoverability","Review the next step available to a shopper","REVIEW"],
    ["03","Product details and variants","Visible information depends on page access","OBSERVED"],
    ["04","Shipping and returns information","Presence and clarity require contextual review","EVIDENCE"],
    ["05","Offer and message consistency","Compare only supplied or observable claims","COMPARE"],
    ["06","Verification after a change","A fresh inspection is required","RECHECK"],
  ];
  return <section className="pfx-section pfx-ledger-section"><div className="pfx-section-wrap pfx-ledger-layout"><div><div className="pfx-eyebrow">AN AUDIT TRAIL YOU CAN FOLLOW</div><h2>Every recommendation starts with <em>something observable.</em></h2><p className="pfx-section-lead">The report should preserve what was inspected, what was found and what still needs verification.</p></div><div className="pfx-ledger"><div className="pfx-ledger-heading"><span>PAGEFIX / EVIDENCE LEDGER</span><small>EXAMPLE RECORD · NOT CUSTOMER DATA</small></div><div className="pfx-ledger-line" aria-hidden="true"/>{entries.map(([n,title,body,label])=><div className="pfx-ledger-row" key={n}><span className="pfx-ledger-number">{n}</span><div><b>{title}</b><p>{body}</p></div><small>{label}</small></div>)}<div className="pfx-ledger-foot">Evidence types: Directly Observed Evidence · Inferred Risk · Hypothesis · Recommendation</div></div></div></section>;
}

export function CommerceSystem() {
  return <section className="pfx-system" id="product-system"><div className="pfx-system-glow" aria-hidden="true"/><div className="pfx-section-wrap"><div className="pfx-eyebrow pfx-eyebrow-light">THE PAGEFIX COMMERCE SYSTEM</div><h2>One connected workflow. <em>Not another pile of audit reports.</em></h2><p className="pfx-section-lead">PageFix is designed to connect inspection, buyer decision intelligence, claim consistency, practical fixes and verification. Individual sellers can use the core workflow independently; teams and agencies can extend it across products and clients.</p><div className="pfx-system-grid">{system.map(([n,title,body])=><article className="pfx-system-card" key={n}><span>{n}</span><h3>{title}</h3><p>{body}</p></article>)}</div><p className="pfx-system-note"><b>Important:</b> This describes the product architecture and capability roadmap. Some advanced capabilities require further implementation, verified data access or third-party integrations; PageFix will identify those limits rather than present planned functionality as live.</p></div></section>;
}

export function PrivacyNote() {
  return <section className="pfx-privacy"><Mark>i</Mark><div><div className="pfx-eyebrow">EVIDENCE, PRIVACY AND SECURITY</div><h2>A public-page audit cannot see private business metrics.</h2><p>Revenue, margins, traffic quality, conversion rates, customer lifetime value, actual abandonment and private customer records require authorized data connections. PageFix must not guess these values. Audit websites you are authorized to inspect, keep credentials server-side and treat every finding according to its actual evidence.</p><div className="pfx-inline-links"><Link href="/privacy">Read privacy information →</Link><Link href="/security">Read security practices →</Link></div></div></section>;
}

export function Faq() {
  return <section className="pfx-section pfx-faq"><div className="pfx-section-wrap"><div className="pfx-eyebrow">BEFORE YOU START</div><h2>Clear expectations. Useful output.</h2><div className="pfx-faq-grid"><details><summary>Will PageFix guarantee more sales or higher search rankings?</summary><p>No. PageFix identifies observable page issues and recommendations. Commercial outcomes depend on many factors outside a public-page audit.</p></details><details><summary>Does it connect to my private analytics automatically?</summary><p>No. Private data must be connected intentionally through an authorized integration. Without it, PageFix reports only what it can observe.</p></details><details><summary>What can I audit?</summary><p>Public product pages, ecommerce pages and landing pages you are authorized to inspect. Some websites may block automated browsers or restrict access.</p></details><details><summary>How do I choose a plan?</summary><p>Starter is $49/month, Growth is $149/month and Agency is $399/month. Custom requirements can be discussed with the team.</p></details></div></div></section>;
}

export function FinalCta() {
  return <section className="pfx-final"><div className="pfx-final-orb" aria-hidden="true"/><div className="pfx-eyebrow pfx-eyebrow-light">START WITH THE PAGE, NOT A GUESS</div><h2>Know what deserves attention before you ship another change.</h2><p>Create a workspace, inspect a public page and review the evidence behind the recommendations.</p><div className="pfx-actions pfx-actions-center"><Link className="pfx-btn pfx-btn-white" href="/auth">Create your workspace →</Link><Link className="pfx-btn pfx-btn-clear" href="/pricing">Compare plans</Link></div></section>;
}

export function Footer() {
  return <footer className="pfx-footer"><div className="pfx-footer-top"><Link className="pfx-logo" href="/"><span className="pfx-logo-mark">✓</span>PageFix<span>AI</span></Link><p>Evidence-led website diagnostics. Clear limits. Practical fixes.</p></div><nav aria-label="Footer navigation"><Link href="/pricing">Pricing</Link><Link href="/compare">Compare tools</Link><Link href="/blog">Blog</Link><Link href="/resources">Resources</Link><Link href="/partners/affiliate">Affiliate program</Link><Link href="/referrals">Referral program</Link><Link href="/methodology">Evidence standard</Link><Link href="/privacy">Privacy</Link><Link href="/security">Security</Link><Link href="/auth">Account</Link></nav><small>© {new Date().getFullYear()} PageFix AI. Audit findings describe observable evidence and do not guarantee commercial outcomes.</small></footer>;
}

export default function LandingPage() {
  return <main className="pfx-landing"><Nav/><Hero/><Strips/><Proof/><Workflow/><Solutions/><Steps/><Audiences/><AuditTrail/><CommerceSystem/><PrivacyNote/><Faq/><FinalCta/><Footer/></main>;
}
