import Link from 'next/link';

export const metadata = { title: 'Security | PageFix AI', description: 'Security design, data boundaries and responsible use of PageFix AI.' };

export default function SecurityPage() {
  return <main className="legal-page">
    <header className="site-nav"><Link href="/" className="brand">PageFix<span>AI</span></Link><div className="nav-actions"><Link href="/privacy">Privacy</Link><Link href="/pricing">Pricing</Link></div></header>
    <article className="legal-content"><div className="eyebrow">SECURITY & RESPONSIBLE USE</div><h1>Security is a product requirement.</h1><p className="legal-lead">PageFix is designed around least-privilege access, server-side secrets, evidence-grounded findings and explicit boundaries on what a public page audit can see.</p>
      <article><h2>Account and session protection</h2><p>Passwords are hashed server-side and authenticated sessions use an HTTP-only cookie. Do not share passwords or session links. Account recovery depends on configured email delivery and should use one-time, expiring tokens.</p></article>
      <article><h2>Audit target protection</h2><p>Audit URLs must be validated to reduce the risk of requests to private or reserved network destinations. Redirects and browser subrequests must also be checked. Users must only inspect websites they are authorized to access. No security filter can be assumed perfect without ongoing testing.</p></article>
      <article><h2>Evidence and AI safety</h2><p>Page content is untrusted input. It must not be allowed to override system instructions, trigger unauthorized actions or cause the product to invent facts. Findings should be tied to observed evidence and classified as Directly Observed Evidence, Inferred Risk, Hypothesis or Recommendation.</p></article>
      <article><h2>Secrets and integrations</h2><p>Database credentials, payment keys, email credentials, AI keys and object-storage secrets belong in server-side environment variables, never in browser code or source control. Payment access must be granted only after server-side provider verification. AI, payment, email and screenshot features remain dependent on correct production configuration.</p></article>
      <article><h2>Data access</h2><p>Audit reports and stored screenshots should be owner-authorized and served through protected routes. Avoid placing private audit data in public object URLs. Review tenant isolation and role checks whenever adding new endpoints.</p></article>
      <article><h2>Reporting a concern</h2><p>If you believe you have found a security issue, send a concise report to <a href="mailto:wisdomfrankceo@gmail.com">wisdomfrankceo@gmail.com</a>. Include steps to reproduce and avoid accessing, changing or exporting data that does not belong to you.</p></article>
      <p><strong>Last updated:</strong> 15 October 2026. These are current product design principles, not a claim of third-party certification or a completed penetration test.</p>
    </article>
  </main>;
}
