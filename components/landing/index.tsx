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
  { label: "01 / OBSERVED", title: "What the page shows", body: "Captured titles, headings, visible copy, links, product details and page elements—subject to what the website allows the inspection to access.", tag: "Report label: Directly Observed Evidence" },
  { label: "02 / INTERPRETED", title: "What may create friction", body: "Potential unanswered buyer questions, unclear next steps or mismatches that deserve human review—not a claim that a customer actually abandoned.", tag: "Report label: Inferred Risk or Hypothesis" },
  { label: "03 / ACTIONABLE", title: "What to fix and recheck", body: "Specific implementation guidance, a stated verification objective and a fresh inspection to see whether the observable issue remains.", tag: "Report label: Recommendation" },
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
  ["01", "Commerce Inspection", "Inspect public product pages, landing pages, visible content, page structure and supported desktop/mobile captures. Every report states what was and was not inspected.", ["Product and landing-page intelligence", "Visual evidence and page anatomy", "Inspection coverage and limitations"]],
  ["02", "Buyer Decision Intelligence", "Review the information shoppers may need to decide, with rules adapted to the product category rather than a universal checklist.", ["Buyer objection coverage", "Product information completeness", "Offer clarity and trust information"]],
  ["03", "Claim & Contradiction Intelligence", "Compare claims across ads, product descriptions, specifications and visible policy content. Show both sides of a suspected discrepancy.", ["Ad-to-page message match", "Specification and offer consistency", "Promise Ledger foundation"]],
  ["04", "Commerce Risk Intelligence", "Surface clarity, trust, usability and post-purchase expectation risks without pretending that a public page proves actual customer behaviour.", ["Mobile and page-friction review", "Category-aware expectation gaps", "Confidence and uncertainty labels"]],
  ["05", "Fix Center", "Turn findings into a manageable work queue, with seller-friendly instructions and copy suggestions grounded in known product facts.", ["Prioritised actions and status history", "Nontechnical, operator and developer guidance", "Fix attempts separated from verification"]],
  ["06", "Verification & Rechecks", "Run a fresh inspection, compare it with prior evidence and record whether the issue was resolved, remains, reappeared or could not be verified.", ["Versioned inspection history", "Before-and-after evidence", "Clear verification outcomes"]],
  ["07", "Store Intelligence", "Build a store-level view across products and pages so sellers can identify recurring patterns instead of treating every audit as isolated.", ["Recurring issue groups", "Prioritised multi-product queue", "Historical progress summaries"]],
  ["08", "Commercial Impact Analysis", "Use seller-provided figures to model transparent scenarios. Separate illustrative estimates from measured business outcomes.", ["Explicit inputs and assumptions", "Sensitivity analysis", "No invented revenue-loss figures"]],
  ["09", "Reports & Sharing", "Create inspection, fix-plan and verification reports that show evidence, coverage, limitations and changes over time.", ["Evidence-linked reporting", "Client-ready summaries", "Controlled, revocable sharing"]],
  ["10", "Integrations & Controlled Actions", "Build toward authorised read-only commerce and analytics connections first, followed by approved changes only where permissions and rollback support exist.", ["Seller-authorised data access", "Least-privilege permissions", "Approval and audit logging"]],
  ["11", "Seller, Team & Agency Workspaces", "Keep the individual seller experience simple while supporting multiple products, collaborators and client-separated workspaces.", ["Seller-first core workflow", "Multi-client agency structure", "Role-based access as supported"]],
  ["12", "Governance & Measurement", "Protect trust with access controls, activity history, evidence provenance and outcome measurement only when reliable data is available.", ["Finding and change audit trail", "Data provenance and privacy controls", "Experimentation as a later-stage capability"]],
] as const;

function Mark({ children }: { children: React.ReactNode }) {
  return <span className="pfx-mark" aria-hidden="true">{children}</span>;
}

export function Nav() {
  return <header className="pfx-nav"><div className="pfx-nav-inner">
    <Link className="pfx-logo" href="/" aria-label="PageFix AI home"><span className="pfx-logo-mark">✓</span>PageFix<span>AI</span></Link>
    <nav className="pfx-nav-links" aria-label="Main navigation">
      <a href="#capabilities">Platform</a><a href="#product-system">Features</a><a href="#how-it-works">How it works</a><a href="#trust">Evidence standard</a>
      <Link href="/compare">Compare tools</Link><Link href="/resources">Guides</Link><Link href="/partners/affiliate">Partners</Link><Link href="/pricing">Pricing</Link>
    </nav>
    <div className="pfx-nav-actions"><Link href="/auth?mode=login">Sign in</Link><Link className="pfx-btn pfx-btn-red pfx-btn-small" href="/auth">Start an audit <span aria-hidden="true">↗</span></Link></div>
  </div></header>;
}


export function BackgroundIcons() {
  const icons = [
    { left: "7%", top: "14%", delay: "-1s", path: "M13 2L3 14h9l-1 8 10-12h-9z" },
    { left: "88%", top: "18%", delay: "-3s", path: "M20 6L9 17l-5-5" },
    { left: "14%", top: "82%", delay: "-5s", path: "M12 2l9 5-9 5-9-5zM3 12l9 5 9-5M3 17l9 5 9-5" },
    { left: "64%", top: "44%", delay: "-6s", path: "M20 6L9 17l-5-5" },
    { left: "40%", top: "88%", delay: "-2s", path: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" }
  ];
  return <div className="pfx-background-icons" aria-hidden="true">{icons.map((icon,i)=><svg key={i} viewBox="0 0 24 24" style={{left:icon.left,top:icon.top,animationDelay:icon.delay}}><path d={icon.path}/></svg>)}</div>;
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
        <div className="pfx-report-body"><div className="pfx-report-label">REPORT WORKSPACE</div><div className="pfx-report-title">Evidence & recommended fixes <span className="pfx-report-pill">Traceable</span></div><p className="pfx-report-disclaimer">Illustrative interface · not customer data</p>
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
  return <section className="pfx-section pfx-proof" id="trust"><div className="pfx-section-wrap"><div className="pfx-eyebrow">PROOF YOU CAN INSPECT</div><h2>Trust the method.<br/><em>Inspect the evidence.</em></h2><p className="pfx-section-lead">We do not substitute invented case studies or made-up conversion lifts for proof. Here is what PageFix is designed to show in a report—and what it will never pretend to know from a public URL alone.</p><div className="pfx-card-grid">{proofItems.map(x=><article className="pfx-card" key={x.label}><div className="pfx-card-label">{x.label}</div><h3>{x.title}</h3><p>{x.body}</p><span className="pfx-tag">{x.tag}</span></article>)}</div><p className="pfx-system-note"><Link href="/methodology">Read our evidence standard →</Link> Product interface previews are illustrative. PageFix does not publish customer testimonials, performance statistics or case-study outcomes unless they are genuine, authorized and verifiable.</p></div></section>;
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
  return <section className="pfx-system" id="product-system"><BackgroundIcons/><div className="pfx-system-glow" aria-hidden="true"/><div className="pfx-section-wrap"><div className="pfx-eyebrow pfx-eyebrow-light">THE PAGEFIX COMMERCE SYSTEM</div><h2>One connected workflow. <em>Not another pile of audit reports.</em></h2><p className="pfx-section-lead">PageFix is designed to connect inspection, buyer decision intelligence, claim consistency, practical fixes and verification. Individual sellers can use the core workflow independently; teams and agencies can extend it across products and clients.</p><div className="pfx-system-grid">{system.map(([n,title,body,bullets])=><article className="pfx-system-card" key={n}><span>{n}</span><h3>{title}</h3><p>{body}</p><ul>{bullets.map(item=><li key={item}>{item}</li>)}</ul></article>)}</div><p className="pfx-system-note"><b>Important:</b> This describes the product architecture and capability roadmap. Some advanced capabilities require further implementation, verified data access or third-party integrations; PageFix will identify those limits rather than present planned functionality as live.</p></div></section>;
}

export function PrivacyNote() {
  return <section className="pfx-privacy"><Mark>i</Mark><div><div className="pfx-eyebrow">EVIDENCE, PRIVACY AND SECURITY</div><h2>A public-page audit cannot see private business metrics.</h2><p>Revenue, margins, traffic quality, conversion rates, customer lifetime value, actual abandonment and private customer records require authorized data connections. PageFix must not guess these values. Audit websites you are authorized to inspect, keep credentials server-side and treat every finding according to its actual evidence.</p><div className="pfx-inline-links"><Link href="/privacy">Read privacy information →</Link><Link href="/security">Read security practices →</Link></div></div></section>;
}


export function TrustStrip() {
  return <section className="pfx-trust-strip"><b>THE PAGEFIX STANDARD</b><span><i>01</i> Observable evidence</span><span><i>02</i> Honest confidence</span><span><i>03</i> Practical remediation</span><span><i>04</i> Verifiable rechecks</span></section>;
}

export function ResourceCta() {
  return <section className="pfx-resource-cta"><div><div className="pfx-eyebrow">MAKE AN INFORMED CHOICE</div><h2>Compare PageFix with the tools you already use.</h2><p>See where page-level friction diagnosis fits alongside SEO crawlers, speed testing and visitor-behaviour analytics.</p></div><div className="pfx-actions"><Link className="pfx-btn pfx-btn-red" href="/compare">Compare tools →</Link><Link className="pfx-btn pfx-btn-outline" href="/resources">Read practical guides</Link></div></section>;
}

export function SpecialistTools() {
  const items = [
    ["01","Pre-Purchase Clarity & Return Risk","Spot unclear sizing, compatibility, deliverables, shipping or return conditions that may create buyer uncertainty. This does not predict a product's actual return rate."],
    ["02","Visual & Mobile Inspection","Review screenshots and captured page anatomy where supported, with viewport context and evidence. A screenshot is a record of one captured state, not proof of every dynamic interaction."],
    ["03","SEO, Product Data & AI Discovery Readiness","Review visible metadata, page structure and structured-data signals. PageFix does not promise rankings, search traffic or inclusion in AI answers."],
    ["04","Grounded AI Copy Fixes","Generate alternative headlines, descriptions and product copy from facts that are actually available. Missing specifications remain placeholders for the seller to confirm."],
    ["05","Competitor Context","Organise public-page comparisons and visible content differences. Competitor revenue, traffic, conversion and private performance are not inferred from a page."],
    ["06","Priority & Fix Effort","Rank the work queue using defined severity, evidence confidence, buyer relevance and implementation effort—not invented financial impact."],
    ["07","Agency & Client Reporting","Extend the seller workflow across client projects, with clear report scope and privacy controls. Advanced permissions and white-label features must be verified before being promised."],
    ["08","Experimentation & Outcome Learning","A later-stage capability for controlled tests, sample-size planning and uncertainty-aware measurement. It requires reliable analytics and should not declare winners prematurely."]
  ];
  return <section className="pfx-section"><div className="pfx-section-wrap"><div className="pfx-eyebrow">SPECIALIST TOOLS INSIDE THE WORKFLOW</div><h2>Purpose-built checks for the problems sellers face every week.</h2><p className="pfx-section-lead">These capabilities connect to the same evidence and remediation history. Availability depends on the inspected page, stored data, and the integrations actually enabled in your workspace.</p><div className="pfx-card-grid pfx-four">{items.map(([n,title,body])=><article className="pfx-card" key={n}><div className="pfx-card-label">{n}</div><h3>{title}</h3><p>{body}</p></article>)}</div></div></section>;
}

export function CategoryIntelligence() {
  const rows = [
    ["Clothing & accessories","Size and fit guidance, material details, care instructions, colour representation and visible variants."],
    ["Electronics","Specifications, compatibility, power requirements, included accessories and visible warranty terms."],
    ["Furniture & home","Dimensions, materials, assembly requirements, delivery conditions and installation clarity."],
    ["Beauty & skincare","Ingredients, directions, suitability information, relevant warnings and substantiation of visible claims."],
    ["Digital products & SaaS","Deliverables, supported platforms, prerequisites, access conditions, onboarding and commercial terms."],
    ["B2B products","Use cases, implementation requirements, integrations, service conditions and support expectations."]
  ];
  return <section className="pfx-section"><div className="pfx-section-wrap pfx-category-layout"><div><div className="pfx-eyebrow">CONTEXT-AWARE, NOT ONE-SIZE-FITS-ALL</div><h2>Different products.<br/><em>Different buyer questions.</em></h2><p className="pfx-section-lead">PageFix evaluates what is relevant to the product and buying context. It does not treat every possible checklist item as mandatory for every seller.</p></div><div className="pfx-category-table"><div className="pfx-category-row pfx-category-head"><span>SELLER CATEGORY</span><span>WHAT PAGEFIX CAN REVIEW</span></div>{rows.map(([name,body])=><div className="pfx-category-row" key={name}><b>{name}</b><span>{body}</span></div>)}</div></div></section>;
}

export function ImpactAnalysis() {
  return <section className="pfx-impact"><div className="pfx-section-wrap"><div className="pfx-eyebrow pfx-eyebrow-light">COMMERCIAL CONTEXT WITHOUT FICTION</div><h2>Show the risk.<br/><em>Never invent the revenue.</em></h2><p>PageFix separates what a page visibly shows from what might happen and what a seller's own business data can establish.</p><div className="pfx-impact-grid"><article><span>LEVEL 01</span><h3>Identified risk</h3><p>Explain the evidence-backed issue and its plausible relevance to a buyer decision. No financial estimate required.</p></article><article><span>LEVEL 02</span><h3>Scenario analysis</h3><p>Use seller-provided traffic, conversion, order value or margin figures with explicit assumptions. Label outputs as illustrative scenarios.</p></article><article><span>LEVEL 03</span><h3>Measured outcome</h3><p>Compare authorised analytics or transaction data with appropriate caveats. Do not claim causation from a simple before-and-after comparison.</p></article></div></div></section>;
}

export function ReportDetails() {
  const items = [
    ["Classification","Directly Observed Evidence, Inferred Risk, Hypothesis or Recommendation."],
    ["Evidence location","The captured text, page element, URL, metadata or other observable signal behind the finding."],
    ["Why it matters","A plain-language explanation of the possible consequence, without claiming a measured conversion impact."],
    ["Confidence & unknowns","A clear confidence level and the information the audit cannot establish from a public page."],
    ["Implementation guidance","Concrete steps and optional copy suggestions tied to the specific issue."],
    ["Verification objective","What should be inspected again after the fix and what would count as resolved, improved or unverified."]
  ];
  return <section className="pfx-section"><div className="pfx-section-wrap"><div className="pfx-eyebrow">WHAT THE REPORT SHOULD CONTAIN</div><h2>Every finding needs a reason and a next step.</h2><p className="pfx-section-lead">Findings are designed around evidence and action, not unsupported scores or inflated claims.</p><div className="pfx-card-grid pfx-three">{items.map(([title,body])=><article className="pfx-card" key={title}><Mark>✓</Mark><h3>{title}</h3><p>{body}</p></article>)}</div></div></section>;
}

export function Faq() {
  return <section className="pfx-section pfx-faq"><div className="pfx-section-wrap"><div className="pfx-eyebrow">BEFORE YOU START</div><h2>Clear expectations. Useful output.</h2><div className="pfx-faq-grid"><details><summary>Will PageFix guarantee more sales or higher search rankings?</summary><p>No. PageFix identifies observable page issues and recommendations. Commercial outcomes depend on many factors outside a public-page audit.</p></details><details><summary>Does it connect to my private analytics automatically?</summary><p>No. Private data must be connected intentionally through an authorized integration. Without it, PageFix reports only what it can observe.</p></details><details><summary>What can I audit?</summary><p>Public product pages, ecommerce pages and landing pages you are authorized to inspect. Some websites may block automated browsers or restrict access.</p></details><details><summary>How do I choose a plan?</summary><p>Starter is $49/month, Growth is $149/month and Agency is $399/month. Custom requirements can be discussed with the team.</p></details></div></div></section>;
}

export function FinalCta() {
  return <section className="pfx-final"><div className="pfx-final-orb" aria-hidden="true"/><div className="pfx-eyebrow pfx-eyebrow-light">START WITH THE PAGE, NOT A GUESS</div><h2>Know what deserves attention before you ship another change.</h2><p>Create a workspace, inspect a public page and review the evidence behind the recommendations.</p><div className="pfx-actions pfx-actions-center"><Link className="pfx-btn pfx-btn-white" href="/auth">Create your workspace →</Link><Link className="pfx-btn pfx-btn-clear" href="/pricing">Compare plans</Link></div></section>;
}

export function Footer() {
  return <footer className="pfx-footer"><div className="pfx-footer-top"><Link className="pfx-logo" href="/"><span className="pfx-logo-mark">✓</span>PageFix<span>AI</span></Link><p>Evidence-led website diagnostics. Clear limits. Practical fixes.</p></div><nav aria-label="Footer navigation"><Link href="/pricing">Pricing</Link><Link href="/compare">Compare tools</Link><Link href="/blog">Blog</Link><Link href="/resources">Resources</Link><Link href="/partners/affiliate">Affiliate program</Link><Link href="/referrals">Referral program</Link><Link href="/methodology">Evidence standard</Link><Link href="/privacy">Privacy</Link><Link href="/security">Security</Link><Link href="/auth">Account</Link><a href="mailto:wisdomfrankceo@gmail.com">Contact</a></nav><small>© {new Date().getFullYear()} PageFix AI. Audit findings describe observable evidence and do not guarantee commercial outcomes.</small></footer>;
}

export default function LandingPage() {
  return <main className="pfx-landing"><Nav/><Hero/><TrustStrip/><Strips/><Proof/><ResourceCta/><Workflow/><Solutions/><Steps/><Audiences/><AuditTrail/><SpecialistTools/><CategoryIntelligence/><ImpactAnalysis/><ReportDetails/><CommerceSystem/><PrivacyNote/><Faq/><FinalCta/><Footer/></main>;
}
