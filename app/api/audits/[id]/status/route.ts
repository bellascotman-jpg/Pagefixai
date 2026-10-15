import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { processNextAuditJob } from '@/lib/jobs/audit-worker';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });

  const { id } = await context.params;
  let audit = await db.audit.findFirst({
    where: { id, userId: user.id },
    include: { jobs: { orderBy: { createdAt: 'desc' }, take: 1 } },
  });
  if (!audit) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

  let job = audit.jobs[0];
  if (job?.status === 'FAILED' && ['QUEUED', 'RUNNING'].includes(audit.status)) {
    await db.audit.updateMany({
      where: { id, userId: user.id, status: { in: ['QUEUED', 'RUNNING'] } },
      data: {
        status: 'FAILED',
        completedAt: job.completedAt ?? new Date(),
        errorCode: job.errorCode || 'AUDIT_WORKER_FAILED',
        errorMessage: job.errorMessage || 'The audit worker could not complete this run.',
      },
    });
    audit = await db.audit.findFirst({
      where: { id, userId: user.id },
      include: { jobs: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!audit) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    job = audit.jobs[0];
  }
  const now = Date.now();
  const staleBefore = new Date(now - 70_000);

  // Recover jobs left RUNNING when the previous Vercel function hit its timeout.
  // The worker's atomic claim prevents a second invocation from processing a live job.
  if (
    job &&
    !['QUEUED', 'COMPLETED', 'FAILED'].includes(job.status) &&
    job.startedAt &&
    job.startedAt < staleBefore
  ) {
    const recovered = await db.auditJob.updateMany({
      where: { id: job.id, status: job.status, startedAt: { lt: staleBefore } },
      data: {
        status: 'QUEUED',
        availableAt: new Date(),
        startedAt: null,
        completedAt: null,
        errorCode: null,
        errorMessage: null,
      },
    });

    if (recovered.count > 0) {
      await db.audit.updateMany({
        where: { id, userId: user.id, status: { in: ['QUEUED', 'RUNNING'] } },
        data: { status: 'QUEUED', startedAt: null, completedAt: null, errorCode: null, errorMessage: null },
      });
      audit = await db.audit.findFirst({
        where: { id, userId: user.id },
        include: { jobs: { orderBy: { createdAt: 'desc' }, take: 1 } },
      });
      if (!audit) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
      job = audit.jobs[0];
    }
  }

  // The browser worker runs in this dedicated request, not in the request that
  // creates the audit. That keeps the create endpoint from timing out in after().
  if (audit.status === 'QUEUED' && job?.status === 'QUEUED') {
    try {
      await processNextAuditJob(id);
    } catch (error) {
      console.error('pagefix_audit_status_worker_failed', {
        auditId: id,
        message: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
      });
    }
  }

  const latest = await db.audit.findFirst({
    where: { id, userId: user.id },
    include: { jobs: { orderBy: { createdAt: 'desc' }, take: 1 } },
  });
  if (!latest) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

  return NextResponse.json({
    audit: {
      id: latest.id,
      status: latest.status,
      errorCode: latest.errorCode,
      errorMessage: latest.errorMessage,
      completedAt: latest.completedAt,
    },
    job: latest.jobs[0]
      ? {
          status: latest.jobs[0].status,
          errorCode: latest.jobs[0].errorCode,
          errorMessage: latest.jobs[0].errorMessage,
          attempt: latest.jobs[0].attempt,
        }
      : null,
  }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
}
