import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { buildCommerceClarityScorecard } from '@/lib/audit/scorecard';
import FeatureAuditReport from '@/components/feature-audit-report';

export default async function ClarityScorecardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth?mode=login');
  const audit = await db.audit.findFirst({
    where: { userId: user.id, status: 'COMPLETED' },
    orderBy: { completedAt: 'desc' },
    include: {
      findings: { include: { evidence: { include: { evidence: true } } }, orderBy: [{ priority: 'asc' }, { severity: 'asc' }] },
      buyerQuestions: { orderBy: { createdAt: 'asc' } },
    },
  });
  const dimensions = audit ? buildCommerceClarityScorecard({
    category: audit.category,
    buyerQuestions: audit.buyerQuestions,
    findings: audit.findings,
  }) : [];

  return <main className="dashboard">
    <header className="topbar"><div><div className="label">DIAGNOSE / CLARITY SCORECARD</div><h1 style={{fontSize:27,margin:'4px 0 0'}}>Clarity Scorecard</h1></div><div style={{display:'flex',gap:10,flexWrap:'wrap'}}><Link className="button button-secondary" href="/dashboard/intelligence">All capabilities</Link><Link className="primary-button" href="/dashboard">Run an inspection →</Link></div></header>
    <div className="container dashboard-main">
      {audit ? <FeatureAuditReport feature="clarity-scorecard" audit={audit} findings={audit.findings} questions={audit.buyerQuestions} dimensions={dimensions} /> :
        <section className="pf-empty-report"><span>CLARITY SCORECARD / FIRST AUDIT</span><h2>Your clarity radar will appear after your first completed audit.</h2><p>PageFix will plot captured buyer-question coverage across product information, buyer objections, offer clarity, trust, usability and post-purchase expectations. Unassessed dimensions will remain visibly unassessed.</p><Link className="primary-button" href="/dashboard">Run your first inspection →</Link></section>}
    </div>
  </main>;
}
