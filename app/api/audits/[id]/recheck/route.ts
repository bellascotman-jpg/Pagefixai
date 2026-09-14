import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { canConsumeUnits, consumeUnits, UNITS } from '@/lib/billing/entitlements';
import { runAudit, ENGINE_VERSION } from '@/lib/audit/engine';

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  const { id } = await context.params;
  const previous = await db.audit.findFirst({ where: { id, userId: user.id }, include: { findings: true } });
  if (!previous) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  if (!(await canConsumeUnits(user.id, UNITS.recheck))) return NextResponse.json({ error: 'USAGE_EXHAUSTED', message: 'You have reached your recheck allowance.' }, { status: 402 });
  const next = await db.audit.create({ data: { userId: user.id, projectId: previous.projectId, storeId: previous.storeId, url: previous.url, engineVersion: ENGINE_VERSION, status: 'QUEUED', jobs: { create: { correlationId: randomUUID() } } } });
  await consumeUnits(user.id, UNITS.recheck, 'recheck', next.id);
  try {
    await runAudit(next.id);
    const after = await db.finding.findMany({ where: { auditId: next.id }, select: { title: true, severity: true } });
    const before = previous.findings.map(f => ({ title: f.title, severity: f.severity }));
    const beforeTitles = new Set(before.map(x => x.title));
    const afterTitles = new Set(after.map(x => x.title));
    const result = [...afterTitles].every(t => beforeTitles.has(t)) && after.length === 0 ? 'RESOLVED' : after.length < before.length ? 'IMPROVED' : after.length > 0 ? 'STILL_DETECTED' : 'UNABLE_TO_VERIFY';
    await db.recheck.create({ data: { auditId: next.id, previousAuditId: previous.id, beforeJson: before, afterJson: after, result, engineVersion: ENGINE_VERSION } });
    return NextResponse.json({ auditId: next.id, result });
  } catch (error) {
    return NextResponse.json({ error: 'RECHECK_FAILED', message: error instanceof Error ? error.message : 'Recheck failed.' }, { status: 500 });
  }
}
