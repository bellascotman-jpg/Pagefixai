import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { toCsv } from '@/lib/reports/csv';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED', message: 'Sign in to export this report.' }, { status: 401 });

  const { id } = await context.params;
  const audit = await db.audit.findFirst({
    where: { id, userId: user.id },
    include: {
      findings: {
        orderBy: [{ priority: 'asc' }, { severity: 'asc' }],
        include: { evidence: { include: { evidence: true } } },
      },
    },
  });
  if (!audit) return NextResponse.json({ error: 'NOT_FOUND', message: 'This report could not be found.' }, { status: 404 });

  const headers = [
    'Report URL', 'Audit ID', 'Audit status', 'Audit created at', 'Audit completed at',
    'Finding title', 'Severity', 'Priority', 'Confidence', 'Effort', 'Workflow status',
    'Direct observation', 'Hypothesis (not verified)', 'Why it matters', 'Recommendation',
    'Implementation steps', 'Suggested copy', 'Evidence sources and locations',
  ];
  const rows = audit.findings.map((finding) => [
    audit.url, audit.id, audit.status, audit.createdAt, audit.completedAt,
    finding.title, finding.severity, finding.priority, finding.confidence, finding.effort,
    finding.status, finding.observation, finding.hypothesis, finding.whyItMatters,
    finding.recommendation, finding.implementationSteps, finding.copySuggestion,
    finding.evidence.map((link) => {
      const evidence = link.evidence;
      return [evidence.type, evidence.source, evidence.location, evidence.content].filter(Boolean).join(' — ');
    }).join(' | '),
  ]);
  const limitation = 'This export contains only evidence saved by PageFix for this audit. Public page inspection does not establish private revenue, conversion rate, traffic quality, customer behaviour or actual checkout abandonment. Recommendations do not guarantee commercial outcomes.';
  const csv = toCsv([headers, ...rows, ['LIMITATIONS', limitation, ...Array(16).fill('')]]);

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="pagefix-report-${audit.id}.csv"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
