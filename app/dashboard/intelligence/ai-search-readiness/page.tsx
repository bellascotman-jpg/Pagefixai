import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db';

function readinessChecks(page: {statusCode:number|null;title:string|null;metaDescription:string|null;canonical:string|null;visibleText:string|null}) {
  return [
    {label:'Successful HTTP response',pass:page.statusCode!==null && page.statusCode>=200 && page.statusCode<300,detail:page.statusCode===null?'HTTP status was not captured':`Captured HTTP ${page.statusCode}`},
    {label:'Page title present',pass:Boolean(page.title?.trim()),detail:page.title?.trim() || 'No title was captured'},
    {label:'Meta description present',pass:Boolean(page.metaDescription?.trim()),detail:page.metaDescription?.trim() || 'No meta description was captured'},
    {label:'Canonical URL present',pass:Boolean(page.canonical?.trim()),detail:page.canonical?.trim() || 'No canonical URL was captured'},
    {label:'Substantive visible text captured',pass:Boolean(page.visibleText && page.visibleText.trim().length>=300),detail:page.visibleText ? `${page.visibleText.trim().length} visible-text characters captured` : 'No visible text was captured'},
  ];
}
export default async function AiSearchReadinessPage() {
  const user=await getCurrentUser();
  if(!user) redirect('/auth?mode=login');
  const audits=await db.audit.findMany({where:{userId:user.id,status:'COMPLETED'},orderBy:{createdAt:'desc'},take:30,select:{id:true,url:true,createdAt:true,pages:{select:{statusCode:true,title:true,metaDescription:true,canonical:true,visibleText:true}}}});
  return <main className="dashboard">
    <header className="topbar"><div><div className="label">PAGEFIX AI / PHASE 7</div><h1 style={{fontSize:27,margin:'4px 0 0'}}>AI search readiness</h1></div><Link className="button button-secondary" href="/dashboard/intelligence">Intelligence hub</Link></header>
    <div className="container dashboard-main">
      <p className="muted" style={{maxWidth:850,lineHeight:1.8}}>Evidence-based technical and content checks for whether a page exposes clear information to crawlers and answer systems. These checks are not an AI visibility score and cannot prove indexing, ranking, citations or traffic.</p>
      <div className="grid grid-3" style={{margin:'22px 0'}}><div className="card"><div className="label">Pages reviewed</div><div className="stat">{audits.length}</div></div><div className="card"><div className="label">Signals checked</div><div className="stat">5</div></div><div className="card"><div className="label">Claim boundary</div><p className="muted">No ranking or citation promises</p></div></div>
      {!audits.length ? <section className="card empty-state"><h2>No completed inspections yet</h2><p className="muted">Run an inspection first. This workspace will show captured technical and content signals from your saved page evidence.</p><Link className="primary-button" href="/dashboard">Inspect a page</Link></section> :
      <div className="grid" style={{gap:18}}>{audits.map(audit=>{const page=audit.pages[0]; if(!page)return <article className="card" key={audit.id}><h2>{audit.url}</h2><p className="muted">No page capture attached to this completed audit; readiness remains unknown.</p><Link href={`/dashboard/audits/${audit.id}`}>Open report →</Link></article>; const checks=readinessChecks(page); return <article className="card" key={audit.id}>
        <div className="section-heading"><div><div className="label">CAPTURED PAGE</div><h2 style={{fontSize:18,overflowWrap:'anywhere'}}>{page.title || audit.url}</h2></div><span className="badge">{checks.filter(c=>c.pass).length} / {checks.length} signals present</span></div>
        <p><a href={audit.url} target="_blank" rel="noreferrer">{audit.url} ↗</a></p>
        <div className="grid" style={{gap:12}}>{checks.map(check=><div key={check.label} style={{border:'1px solid var(--border, #ddd)',borderRadius:10,padding:12}}><div className="section-heading"><strong>{check.label}</strong><span className="badge">{check.pass?'Observed':'Missing / not observed'}</span></div><p className="muted" style={{overflowWrap:'anywhere'}}>{check.detail}</p></div>)}</div>
        <p className="muted" style={{fontSize:12}}>Captured {audit.createdAt.toLocaleString()}. These checks cover stored capture fields only; they do not validate full schema correctness, robots directives, sitemap access, indexing or AI citations.</p>
        <Link href={`/dashboard/audits/${audit.id}`}>Review full evidence →</Link>
      </article>})}</div>}
    </div>
  </main>;
}
