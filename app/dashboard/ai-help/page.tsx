import Link from 'next/link';
import { redirect } from 'next/navigation';
import AiHelpWorkspace from '@/components/ai-help-workspace';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AiHelpPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth?mode=login');

  const audits = await db.audit.findMany({
    where: { userId: user.id, status: 'COMPLETED' },
    orderBy: { completedAt: 'desc' },
    take: 10,
    select: { id: true, url: true, completedAt: true },
  });

  return <main className="dashboard">
    <header className="topbar"><div><div className="label">PAGEFIX AI / AI WORKBENCH</div><h1 style={{fontSize:27,margin:'4px 0 0'}}>PageFix AI assistant</h1></div><div style={{display:'flex',gap:10,flexWrap:'wrap'}}><Link className="button button-secondary" href="/dashboard/intelligence">Analysis tools</Link><Link className="primary-button" href="/dashboard">Run an inspection →</Link></div></header>
    <div className="container dashboard-main">
      <p className="muted" style={{maxWidth:850,lineHeight:1.8}}>An evidence-aware assistant for understanding audit findings, improving SEO, drafting page copy and turning recommendations into a step-by-step implementation plan. It uses the selected saved audit when available and does not invent business metrics.</p>
      <AiHelpWorkspace audits={audits.map(audit=>({id:audit.id,url:audit.url,completedAt:audit.completedAt?.toISOString() ?? null}))} />
    </div>
  </main>;
}
