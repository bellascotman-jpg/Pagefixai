import { randomUUID } from 'node:crypto';
import { db } from '@/lib/db';
import { runAudit } from '@/lib/audit/engine';
import { interpretAudit } from '@/lib/ai/reason';
import { interpretAuditVisuals } from '@/lib/ai/visual';

async function bounded<T>(promise: Promise<T>, milliseconds: number, code: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(code)), milliseconds);
        timer.unref?.();
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function processNextAuditJob(auditId?: string) {
  const job = await db.auditJob.findFirst({
    where: { status: 'QUEUED', availableAt: { lte: new Date() }, ...(auditId ? { auditId } : {}) },
    orderBy: { createdAt: 'asc' },
  });
  if (!job) return { processed: false as const };

  const claimed = await db.auditJob.updateMany({
    where: { id: job.id, status: 'QUEUED' },
    data: { status: 'ACQUIRING_PAGE', attempt: { increment: 1 }, startedAt: new Date(), correlationId: job.correlationId || randomUUID() },
  });
  if (!claimed.count) return { processed: false as const };

  try {
    const result = await runAudit(job.auditId);
    await db.auditJob.update({ where: { id: job.id }, data: { status: 'COMPLETED', completedAt: new Date(), errorCode: null, errorMessage: null } });

    let ai: unknown = { skipped: true, reason: 'AI_NOT_RUN' };
    let visualAi: unknown = { skipped: true, reason: 'AI_VISUAL_NOT_RUN' };
    const warnings: string[] = [];
    try {
      ai = await bounded(interpretAudit(job.auditId), 5_000, 'AI_REASONING_TIMEOUT');
      if (ai && typeof ai === 'object' && 'skipped' in ai && ai.skipped) {
        warnings.push('AI text reasoning was skipped; evidence-based checks remain available.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI reasoning failed.';
      warnings.push(message);
      console.error('pagefix_ai_reasoning_failed', { auditId: job.auditId, message });
    }

    // Run visual reasoning independently so AI_VISION_KEY can be configured
    // even when the text-reasoning provider key is not present.
    try {
      visualAi = await bounded(interpretAuditVisuals(job.auditId), 8_000, 'AI_VISUAL_REASONING_TIMEOUT');
      if (visualAi && typeof visualAi === 'object' && 'skipped' in visualAi && visualAi.skipped) {
        const reason = 'reason' in visualAi && typeof visualAi.reason === 'string' ? visualAi.reason : 'UNKNOWN';
        if (reason !== 'AI_PROVIDER_NOT_CONFIGURED') warnings.push(`AI visual reasoning was skipped (${reason}); evidence-based checks remain available.`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI visual reasoning failed.';
      warnings.push(message);
      console.error('pagefix_ai_visual_reasoning_failed', { auditId: job.auditId, message });
    }

    const aiWarning = warnings.length ? warnings.join('; ').slice(0, 1000) : null;
    await db.auditJob.update({
      where: { id: job.id },
      data: { status: 'COMPLETED', completedAt: new Date(), errorCode: aiWarning ? 'AI_REASONING_UNAVAILABLE' : null, errorMessage: aiWarning },
    });
    return { processed: true as const, auditId: job.auditId, result, ai, visualAi, aiWarning };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Audit worker failed.';
    await db.audit.update({ where: { id: job.auditId }, data: { status: 'FAILED', completedAt: new Date(), errorCode: message, errorMessage: message } }).catch(() => undefined);
    await db.auditJob.update({ where: { id: job.id }, data: { status: 'FAILED', completedAt: new Date(), errorCode: message, errorMessage: message } }).catch(() => undefined);
    return { processed: true as const, failed: true as const, auditId: job.auditId, error: message };
  }
}
