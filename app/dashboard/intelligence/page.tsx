import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';

const groups = [
  { title: 'ANALYSIS', items: [
    ['Buyer Decisions','buyer-decisions'], ['Clarity Scorecard','clarity-scorecard'], ['Pre-Purchase & Return Risk','return-risk'], ['Visual & Mobile Inspection','visual-inspection'], ['SEO & Product Data','seo-data'], ['AI Search Readiness','ai-search-readiness'], ['Store Intelligence','store'], ['Competitor Comparison','/dashboard/competitors'],
  ]},
  { title: 'OPTIMIZATION', items: [
    ['Grounded Copy Fixes','copy-fixes'], ['Impact Analysis','impact'], ['Journey & Message Match','journey'], ['Ads & Creative Studio','/dashboard/creative-studio'], ['A/B Testing','/dashboard/experiments'], ['Claims & Promises','claims'], ['Promise Ledger','promise-ledger'], ['Retention & Onboarding','/dashboard/intelligence/retention'], ['Experimentation','experiments'], ['Verification History','verification'], ['Evidence & Governance','governance'],
  ]},
  { title: 'WORKSPACE', items: [
    ['PageFix AI Assistant','/dashboard/ai-help'], ['Integrations','/dashboard/intelligence/integrations'], ['Seller & Agency Workspaces','workspaces'],
  ]},
];

export default async function IntelligenceHubPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth?mode=login');
  return <main className="dashboard">
    <header className="topbar"><div><div className="label">PAGEFIX AI</div><h1 style={{fontSize:27,margin:'4px 0 0'}}>Intelligence</h1></div><Link className="primary-button" href="/dashboard">New inspection</Link></header>
    <div className="container dashboard-main">
      {groups.map(group => <section key={group.title} style={{marginBottom:28}}>
        <div className="label" style={{marginBottom:12}}>{group.title}</div>
        <div className="grid grid-3">{group.items.map(([title,slug]) => <Link key={title} href={slug.startsWith('/') ? slug : '/dashboard/intelligence/'+slug} className="card" style={{textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,minHeight:72}}><strong>{title}</strong><span aria-hidden="true">→</span></Link>)}</div>
      </section>)}
    </div>
  </main>;
}
