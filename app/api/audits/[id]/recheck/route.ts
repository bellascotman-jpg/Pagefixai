import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { canConsumeUnits, consumeUnits, UNITS } from '@/lib/billing/entitlements';
import { ENGINE_VERSION } from '@/lib/audit/engine';
import { processNextAuditJob } from '@/lib/jobs/audit-worker';
import { evaluateRecheckVerification } from '@/lib/audit/recheck-verification';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  const { id } = await context.params;
  const previous = await db.audit.findFirst({
    where: { id, userId: user.id },
    include: { findings: true },
  });
  if (!previous) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  if (previous.status !== 'COMPLETED') {
    return NextResponse.json({
      error: 'AUDIT_NOT_COMPLETED',
      message: 'Only a completed audit can be rechecked. Wait for the original inspection to finish first.',
    }, { status: 409 });
  }
  if (!previous.findings.length) {
    return NextResponse.json({
      error: 'NO_FINDINGS_TO_RECHECK',
      message: 'This audit has no findings to verify. Run a fresh audit if you want to inspect the page again.',
    }, { status: 409 });
  }
  if (!(await canConsumeUnits(user.id, UNITS.recheck))) {
    return NextResponse.json({ error: 'USAGE_EXHAUSTED', message: 'You have reached your recheck allowance.' }, { status: 402 });
  }

  const next = await db.audit.create({
    data: {
      userId: user.id,
      projectId: previous.projectId,
      storeId: previous.storeId,
      url: previous.url,
      engineVersion: ENGINE_VERSION,
      status: 'QUEUED',
      jobs: { create: { correlationId: randomUUID() } },
    },
  });

  try {
    await consumeUnits(user.id, UNITS.recheck, 'recheck', next.id);
    const workerResult = await processNextAuditJob(next.id);
    const nextAudit = await db.audit.findFirst({
      where: { id: next.id, userId: user.id },
      include: {
        findings: { select: { title: true, severity: true } },
        pages: { select: { statusCode: true, visibleText: true } },
      },
    });
    if (!nextAudit) {
      return NextResponse.json({ error: 'RECHECK_FAILED', message: 'The recheck record could not be retrieved.' }, { status: 500 });
    }

    const before = previous.findings.map(f => ({ title: f.title, severity: f.severity }));
    const after = nextAudit.findings;
    const decision = evaluateRecheckVerification({
      previousEngineVersion: previous.engineVersion,
      currentEngineVersion: nextAudit.engineVersion,
      auditStatus: nextAudit.status,
      pages: nextAudit.pages,
      findings: after,
    });
    const afterTitles = new Set(after.map(f => f.title.trim().toLowerCase()));
    let verifiedCount = 0;
    let stillDetectedCount = 0;
    let unableToVerifyCount = 0;

    for (const finding of previous.findings) {
      const status = !decision.canVerify
        ? 'UNABLE_TO_VERIFY'
        : afterTitles.has(finding.title.trim().toLowerCase())
          ? 'STILL_DETECTED'
          : 'VERIFIED';
      if (status === 'VERIFIED') verifiedCount += 1;
      if (status === 'STILL_DETECTED') stillDetectedCount += 1;
      if (status === 'UNABLE_TO_VERIFY') unableToVerifyCount += 1;
      await db.finding.updateMany({
        where: { id: finding.id, auditId: previous.id },
        data: { status },
      });
    }

    const result = !decision.canVerify
      ? 'UNABLE_TO_VERIFY'
      : verifiedCount === before.length
        ? 'RESOLVED'
        : verifiedCount > 0
          ? 'IMPROVED'
          : 'STILL_DETECTED';

    await db.recheck.create({
      data: {
        auditId: next.id,
        previousAuditId: previous.id,
        beforeJson: before,
        afterJson: after,
        result,
        engineVersion: ENGINE_VERSION,
      },
    });

    return NextResponse.json({
      auditId: next.id,
      result,
      verifiedCount,
      stillDetectedCount,
      unableToVerifyCount,
      verificationReason: decision.reason,
      message: result === 'UNABLE_TO_VERIFY'
        ? 'The fresh inspection could not reliably verify the previous findings. No finding was marked resolved. Review the new report before trying again.'
        : result === 'RESOLVED'
          ? 'The previous finding titles were absent from a successful fresh capture using the same inspection engine. Review the evidence; this does not establish a business outcome.'
          : result === 'IMPROVED'
            ? 'Some previous finding titles were absent and some remain detectable. Review each finding and its new evidence.'
            : 'The previous finding titles remain detectable in the fresh inspection.',
      workerFailed: Boolean(workerResult && 'failed' in workerResult && workerResult.failed),
    });
  } catch (error) {
    return NextResponse.json({
      error: 'RECHECK_FAILED',
      message: error instanceof Error ? error.message : 'Recheck failed.',
    }, { status: 500 });
  }
}
