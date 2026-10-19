import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { FOUNDER_EMAIL } from '@/lib/plans';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function FounderAuditsPage() {
  const user = await getCurrentUser();
  if (!user || !(user.role === 'ADMIN' || (user.role === 'FOUNDER' && user.email.toLowerCase() === FOUNDER_EMAIL))) redirect('/dashboard');
  const audits = await db.audit.findMany({
    orderBy: { createdAt: 'desc' }, take: 200,
    include: { user: { select: { id: true, name: true, email: true } }, findings: { select: { id: true } } },
  });
  const totals = await db.audit.groupBy({ by: ['status'], _count: { _all: true } });
  const counts = new Map(totals.map(item => [item.status, item._count._all]));
  return <main className="dashboard">
    <header className="topbar"><div><div className="label">PAGEFIX AI / FOUNDER OPERATIONS</div><h1 style={{fontSize:25,margin:'4px 0 0'}}>All audits</h1></div><Link href="/founder" className="button button-secondary">← Founder console</Link></header>
    <div className="container dashboard-main">
      <p className="muted">Cross-account audit operations. This view shows stored records only and does not invent results or revenue impact.</p>
      <div className="grid grid-3" style={{marginTop:22}}>{[['Total shown',audits.length],['Completed',counts.get('COMPLETED')||0],['Queued / running',(counts.get('QUEUED')||0)+(counts.get('RUNNING')||0)],['Failed',counts.get('FAILED')||0]].map(([label,value])=><div className="card" key={String(label)}><div className="label">{label}</div><div className="stat">{value}</div></div>)}</div>
      <section className="card" style={{marginTop:22}}><h2>Recent audit records</h2>{audits.length===0?<p className="muted">No audits have been recorded yet.</p>:<div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',minWidth:800,fontSize:13}}><thead><tr style={{textAlign:'left',borderBottom:'1px solid var(--line)'}}>{['URL / project','Account','Status','Findings','Created','Record'].map(v=><th key={v} style={{padding:'12px 10px',fontSize:11,textTransform:'uppercase',letterSpacing:'.06em',color:'var(--muted)'}}>{v}</th>)}</tr></thead><tbody>{audits.map(a=><tr key={a.id} style={{borderBottom:'1px solid var(--line)'}}><td style={{padding:'13px 10px',maxWidth:300,overflowWrap:'anywhere'}}><strong>{a.url}</strong><div className="muted">Engine {a.engineVersion}</div></td><td style={{padding:'13px 10px'}}>{a.user.name||'Unnamed'}<div className="muted">{a.user.email}</div></td><td style={{padding:'13px 10px'}}><span className="badge">{a.status}</span>{a.errorCode&&<div className="muted">{a.errorCode}</div>}</td><td style={{padding:'13px 10px'}}>{a.findings.length}</td><td style={{padding:'13px 10px'}}>{new Date(a.createdAt).toLocaleString()}</td><td style={{padding:'13px 10px'}}><Link className="button button-secondary" style={{minHeight:34,padding:'7px 10px',fontSize:12}} href={'/dashboard/audits/'+a.id}>Open</Link></td></tr>)}</tbody></table></div>}</section>
    </div>
  </main>;
}
