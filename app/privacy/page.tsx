import Link from 'next/link';

export const metadata = { title: 'Privacy | PageFix AI', description: 'How PageFix AI handles account, audit and website information.' };

export default function PrivacyPage() {
  return <main className="legal-page">
    <header className="site-nav"><Link href="/" className="brand">PageFix<span>AI</span></Link><div className="nav-actions"><Link href="/security">Security</Link><Link href="/pricing">Pricing</Link></div></header>
    <article className="legal-content"><div className="eyebrow">PRIVACY INFORMATION</div><h1>Privacy, with clear limits.</h1><p className="legal-lead">PageFix AI is designed to inspect public pages and help users understand observable page-level issues. This page explains the intended handling of information in the current product. It is not a substitute for legal advice or a jurisdiction-specific privacy notice.</p>
      <article><h2>Information processed</h2><p>Account details such as name and email, authentication/session records, workspace data, audit URLs, captured page evidence, findings, recheck records and usage records may be processed to operate the service. The exact data available depends on enabled features and integrations.</p></article>
      <article><h2>Website content and audit data</h2><p>When you submit a URL, PageFix may retrieve public page content and technical signals needed to produce the audit. Only submit websites you are authorized to inspect. Public page audits do not provide access to private analytics, customer accounts, order histories or private business systems unless an explicit authorized integration is separately implemented and connected.</p></article>
      <article><h2>How information is used</h2><p>Information is used to authenticate users, operate workspaces, process audits, display reports, enforce plan allowances, support account recovery, protect the service and improve reliability. It must not be used to fabricate analytics, testimonials, rankings or business outcomes.</p></article>
      <article><h2>Service providers and storage</h2><p>The application may use hosting, database, payment, email, AI and object-storage providers when those integrations are configured. Provider-specific processing, retention and regional handling depend on the selected service and its terms. Optional screenshot storage is not available unless its storage configuration is supplied.</p></article>
      <article><h2>Security and retention</h2><p>PageFix uses server-side account sessions and is designed to restrict private audit data to its owner. No online service can promise absolute security. Audit and account records may be retained while needed to provide the service, meet operational requirements or address abuse; production retention and deletion controls must be reviewed before broad public launch.</p></article>
      <article><h2>Your choices and contact</h2><p>Do not submit secrets, personal customer data or sensitive URLs unless the feature and permissions explicitly support them. For account or privacy questions, contact <a href="mailto:wisdomfrankceo@gmail.com">wisdomfrankceo@gmail.com</a>. Applicable rights may depend on your location and the laws that apply.</p></article>
      <p><strong>Last updated:</strong> 15 October 2026. This notice must be reviewed against the final production data flows before public commercial launch.</p>
    </article>
  </main>;
}
