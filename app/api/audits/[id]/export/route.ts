import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED', message: 'Sign in to export this report.' }, { status: 401 });
  const { id } = await context.params;
  const audit = await db.audit.findFirst({
    where: { id, userId: user.id },
    include: {
      findings: { include: { evidence: { include: { evidence: true } } } },
      evidence: true,
      pages: { select: { url: true, statusCode: true, title: true, canonical: true, metaDescription: true, createdAt: true } },
      buyerQuestions: true,
      rechecks: true,
    },
  });
  if (!audit) return NextResponse.json({ error: 'NOT_FOUND', message: 'This report could not be found.' }, { status: 404 });
  const report = {
    product: 'PageFix AI',
    exportVersion: 1,
    exportedAt: new Date().toISOString(),
    audit: {
      id: audit.id, url: audit.url, engineVersion: audit.engineVersion, status: audit.status,
      category: audit.category, createdAt: audit.createdAt, completedAt: audit.completedAt,
      pages: audit.pages, evidence: audit.evidence,
      findings: audit.findings.map(f => ({
        id: f.id, title: f.title, severity: f.severity, confidence: f.confidence, effort: f.effort,
        priority: f.priority, status: f.status, observation: f.observation, hypothesis: f.hypothesis,
        whyItMatters: f.whyItMatters, recommendation: f.recommendation,
        implementationSteps: f.implementationSteps, copySuggestion: f.copySuggestion,
        evidence: f.evidence.map(link => link.evidence),
      })),
      buyerQuestionCoverage: audit.buyerQuestions,
      rechecks: audit.rechecks,
    },
    limitations: [
      'This export includes only information stored by PageFix for this audit.',
      'Public page inspection does not establish private revenue, conversion rate, traffic quality, customer behaviour or actual checkout abandonment.',
      'Recommendations do not guarantee commercial outcomes.',
    ],
  };
  return new Response(JSON.stringify(report, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="pagefix-report-${audit.id}.json"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
