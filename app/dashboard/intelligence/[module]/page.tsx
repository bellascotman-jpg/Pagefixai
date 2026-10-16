import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { capabilities } from '@/lib/product/capabilities';

export default async function IntelligenceModulePage({ params }: { params: Promise<{ module: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/auth?mode=login');
  const { module } = await params;
  const capability = capabilities.find(item => item.slug === module);
  if (!capability) notFound();
  const statusClass = capability.status === 'Available in current workflow' ? 'status-available' : capability.status === 'Foundation / needs validation' ? 'status-foundation' : 'status-planned';
  return <main className="dashboard">
    <header className="topbar"><div><div className="label">COMMERCE INTELLIGENCE / {capability.group.toUpperCase()}</div><h1 style={{fontSize:27,margin:'4px 0 0'}}>{capability.title}</h1></div><Link className="button button-secondary" href="/dashboard/intelligence">All capabilities</Link></header>
    <div className="container dashboard-main">
      <div className="capability-detail-hero card"><div className="capability-workspace-top"><span>{capability.group}</span><span className={`capability-status ${statusClass}`}>{capability.status}</span></div><h2>{capability.title}</h2><p>{capability.summary}</p><div className="capability-detail-actions"><Link href="/dashboard" className="primary-button">Open audit workspace →</Link><Link href="/dashboard/fixes" className="button button-secondary">Open Fix Center</Link></div></div>
      <div className="grid grid-2" style={{marginTop:18}}>
        <section className="card"><h2>What this capability covers</h2><ul className="capability-detail-list">{capability.whatItDoes.map(item=><li key={item}>{item}</li>)}</ul></section>
        <section className="card"><h2>Limits and safeguards</h2><ul className="capability-detail-list">{capability.limits.map(item=><li key={item}>{item}</li>)}</ul></section>
      </div>
      <section className="card" style={{marginTop:18}}><div className="label">NEXT STEP</div><h2>How to use this today</h2><p className="muted" style={{lineHeight:1.8}}>{capability.next}</p><p className="muted" style={{lineHeight:1.8}}>PageFix classifies findings using exactly one of these labels: <strong>Directly Observed Evidence</strong>, <strong>Inferred Risk</strong>, <strong>Hypothesis</strong> or <strong>Recommendation</strong>. Severity and confidence are separate, and inability to inspect content must not be reported as proof that it is absent.</p></section>
      <div className="capability-next-links">{capabilities.filter(item=>item.slug!==capability.slug).slice(0,4).map(item=><Link key={item.slug} href={`/dashboard/intelligence/${item.slug}`}>{item.title} →</Link>)}</div>
    </div>
  </main>;
}
