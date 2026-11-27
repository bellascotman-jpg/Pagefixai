import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import FeatureAuditReport from '@/components/feature-audit-report';

const buyerPattern = /buyer|value proposition|proof|trust|claim|promise|purchase action|commercial action|shipping|return|refund|benefit|decision|product details|compatibility|size|fit|included/i;

export default async function BuyerDecisionsPage() {
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

  return <main className="dashboard">
    <header className="topbar"><div><div className="label">DIAGNOSE / BUYER DECISIONS</div><h1 style={{fontSize:27,margin:'4px 0 0'}}>Buyer Decisions</h1></div><div style={{display:'flex',gap:10,flexWrap:'wrap'}}><Link className="button button-secondary" href="/dashboard/intelligence">All capabilities</Link><Link className="primary-button" href="/dashboard">Run an inspection →</Link></div></header>
    <div className="container dashboard-main">
      {audit ? <FeatureAuditReport feature="buyer-decisions" audit={audit} findings={audit.findings.filter(f => buyerPattern.test(f.title + ' ' + f.observation + ' ' + f.recommendation))} questions={audit.buyerQuestions} dimensions={[]} /> :
        <section className="pf-empty-report"><span>BUYER DECISIONS / FIRST AUDIT</span><h2>Your buyer-decision report will appear after your first completed audit.</h2><p>PageFix will inspect the captured page for product information, offer clarity, trust, delivery, returns and purchase-action signals. No sample findings are presented as real results.</p><Link className="primary-button" href="/dashboard">Run your first inspection →</Link></section>}
    </div>
  </main>;
}
