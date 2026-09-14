import { randomUUID } from 'node:crypto';
import { db } from '@/lib/db';
import { runAudit } from '@/lib/audit/engine';
import { interpretAudit } from '@/lib/ai/reason';

export async function processNextAuditJob() {
  const job = await db.auditJob.findFirst({
    where: { status: 'QUEUED', availableAt: { lte: new Date() } },
    orderBy: { createdAt: 'asc' },
  });

  if (!job) return { processed: false as const };

  const claimed = await db.auditJob.updateMany({
    where: { id: job.id, status: 'QUEUED' },
    data: {
      status: 'ACQUIRING_PAGE',
      attempt: { increment: 1 },
      startedAt: new Date(),
      correlationId: job.correlationId || randomUUID(),
    },
  });

  if (!claimed.count) return { processed: false as const };

  try {
    await runAudit(job.auditId);
    const ai = await interpretAudit(job.auditId);
    await db.auditJob.update({
      where: { id: job.id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
    return { processed: true as const, auditId: job.auditId, ai };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Audit worker failed.';
    await db.auditJob.update({
      where: { id: job.id },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        errorCode: message,
        errorMessage: message,
      },
    }).catch(() => undefined);
    return { processed: true as const, failed: true as const, auditId: job.auditId, error: message };
  }
}
