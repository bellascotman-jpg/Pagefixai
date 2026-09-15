import { after, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { consumeUnits, canConsumeUnits, UNITS } from '@/lib/billing/entitlements';
import { validateAuditUrl } from '@/lib/audit/ssrf';
import { ENGINE_VERSION } from '@/lib/audit/engine';
import { processNextAuditJob } from '@/lib/jobs/audit-worker';

const schema = z.object({
  url: z.string().url().max(2048),
  projectName: z.string().trim().min(2).max(100).default('My Store'),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: 'UNAUTHENTICATED', message: 'Sign in required.' },
      { status: 401 },
    );
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', message: 'Enter a valid store URL.' },
      { status: 400 },
    );
  }

  try {
    const url = await validateAuditUrl(parsed.data.url);

    if (!(await canConsumeUnits(user.id, UNITS.audit))) {
      return NextResponse.json(
        {
          error: 'USAGE_EXHAUSTED',
          message: 'You have reached your audit allowance. Upgrade your plan to continue.',
        },
        { status: 402 },
      );
    }

    const membership = await db.membership.findFirst({
      where: {
        userId: user.id,
        role: { in: ['OWNER', 'ADMIN', 'MEMBER'] },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'CONFIGURATION_ERROR', message: 'Your workspace is not configured.' },
        { status: 500 },
      );
    }

    const project = await db.project.create({
      data: {
        organizationId: membership.organizationId,
        name: parsed.data.projectName,
      },
    });

    const store = await db.store.create({
      data: {
        projectId: project.id,
        name: new URL(url).hostname,
        url: url.toString(),
      },
    });

    const audit = await db.audit.create({
      data: {
        userId: user.id,
        projectId: project.id,
        storeId: store.id,
        url: url.toString(),
        engineVersion: ENGINE_VERSION,
        status: 'QUEUED',
      },
    });

    await consumeUnits(user.id, UNITS.audit, 'audit', audit.id);
    await db.auditJob.create({
      data: {
        auditId: audit.id,
        correlationId: randomUUID(),
      },
    });

    // Start the queued job after the HTTP response without requiring a Hobby-plan cron.
    // The worker claims jobs atomically, so concurrent requests cannot process the same job twice.
    after(async () => {
      try {
        await processNextAuditJob();
      } catch {
        // The queued job remains available for a later worker invocation.
      }
    });

    return NextResponse.json(
      {
        audit: {
          id: audit.id,
          status: audit.status,
          engineVersion: audit.engineVersion,
        },
      },
      { status: 202 },
    );
  } catch (error) {
    const code = error instanceof Error ? error.message : 'SERVER_ERROR';
    const known = [
      'BLOCKED_PRIVATE_HOST',
      'BLOCKED_PRIVATE_IP',
      'BLOCKED_URL_SCHEME',
      'BLOCKED_URL_CREDENTIALS',
      'INVALID_URL',
    ];

    return NextResponse.json(
      {
        error: known.includes(code) ? code : 'SERVER_ERROR',
        message: known.includes(code)
          ? 'That URL cannot be audited for security reasons.'
          : 'We could not start the audit.',
      },
      { status: known.includes(code) ? 400 : 500 },
    );
  }
}
