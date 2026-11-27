import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import IntelligenceFeatureReport from '@/components/intelligence-feature-report';

export default async function ImpactPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth?mode=login');
  const audits = await db.audit.findMany({
    where: { userId: user.id, status: 'COMPLETED' },
    orderBy: { completedAt: 'desc' },
    take: 10,
    include: {
      findings: { include: { evidence: { include: { evidence: true } } }, orderBy: [{ priority: 'asc' }, { severity: 'asc' }] },
      pages: { select: { statusCode: true, title: true, metaDescription: true, canonical: true, visibleText: true }, orderBy: { createdAt: 'desc' }, take: 1 },
      evidence: { select: { id: true, type: true, source: true, location: true, content: true } },
    },
  });
  return <IntelligenceFeatureReport module="impact" audits={audits} />;
}
