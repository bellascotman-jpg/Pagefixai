import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { capabilities } from '@/lib/product/capabilities';

export default async function IntelligenceHubPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth?mode=login');
  return <main className="dashboard">
    <header className="topbar"><div><div className="label">PAGEFIX AI / COMMERCE INTELLIGENCE</div><h1 style={{fontSize:27,margin:'4px 0 0'}}>Commerce intelligence hub</h1></div><Link className="primary-button" href="/dashboard">Start an inspection</Link></header>
    <div className="container dashboard-main">
      <p className="muted" style={{maxWidth:850,lineHeight:1.8}}>One seller-first system for inspecting commercial pages, understanding buyer-facing risks, organising fixes and verifying changes. The status labels below distinguish current workflows from capabilities that need more engineering or authorised integrations.</p>
      <div className="grid grid-3" style={{margin:'22px 0'}}>
        <div className="card"><div className="label">Core loop</div><h3>Inspect → Fix → Verify</h3><p className="muted">Start with a supported public-page audit and keep the evidence linked to the work.</p></div>
        <div className="card"><div className="label">Evidence standard</div><h3>Four exact labels</h3><p className="muted">Observed evidence, inferred risk, hypothesis and recommendation are kept distinct.</p></div>
        <div className="card"><div className="label">Commercial honesty</div><h3>No invented outcomes</h3><p className="muted">Financial scenarios require explicit inputs; measured outcomes require reliable data.</p></div>
      </div>
      <div className="capability-workspace-grid">{capabilities.map(item=><Link href={`/dashboard/intelligence/${item.slug}`} className="capability-workspace-card" key={item.slug}>
        <div className="capability-workspace-top"><span>{item.group}</span><span className={item.status==='Available in current workflow'?'capability-status status-available':item.status==='Foundation / needs validation'?'capability-status status-foundation':'capability-status status-planned'}>{item.status}</span></div>
        <h2>{item.title}</h2><p>{item.summary}</p><span className="capability-open">View capability details →</span>
      </Link>)}</div>
      <div className="card" style={{marginTop:22}}><h2>Important product status note</h2><p className="muted" style={{lineHeight:1.8}}>This hub documents the capability architecture and the current maturity of each area. A listed capability is not automatically a claim that all advanced behaviour is live. We will change status only after the relevant route, workflow, data handling and acceptance tests are verified.</p></div>
    </div>
  </main>;
}
