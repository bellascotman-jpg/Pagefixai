import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { captureAuditScreenshots } from '@/lib/audit/screenshots';
import { isScreenshotStorageConfigured } from '@/lib/storage/object-store';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED', message: 'Sign in to capture screenshots.' }, { status: 401 });

  const { id } = await context.params;
  const audit = await db.audit.findFirst({
    where: { id, userId: user.id },
    include: {
      pages: { select: { id: true }, orderBy: { createdAt: 'desc' }, take: 1 },
      screenshots: { select: { viewport: true, storageUrl: true } },
    },
  });
  if (!audit) return NextResponse.json({ error: 'NOT_FOUND', message: 'Audit not found.' }, { status: 404 });
  if (audit.status !== 'COMPLETED') {
    return NextResponse.json({ error: 'AUDIT_NOT_COMPLETED', message: 'Wait for the audit to finish before capturing screenshots.' }, { status: 409 });
  }
  if (!audit.pages[0]) {
    return NextResponse.json({ error: 'NO_PAGE_CAPTURE', message: 'This audit has no saved page capture to screenshot.' }, { status: 409 });
  }
  if (!isScreenshotStorageConfigured()) {
    return NextResponse.json({
      error: 'SCREENSHOT_STORAGE_NOT_CONFIGURED',
      message: 'Private screenshot storage is not configured for this deployment. No screenshot was created.',
    }, { status: 503 });
  }

  const alreadyStored = new Set(audit.screenshots.filter(item => item.storageUrl).map(item => item.viewport));
  if (alreadyStored.has('desktop') && alreadyStored.has('mobile')) {
    return NextResponse.json({ auditId: id, captured: 0, screenshots: ['desktop', 'mobile'], alreadyAvailable: true });
  }

  try {
    const captures = await captureAuditScreenshots(id, audit.url);
    for (const capture of captures) {
      const existing = await db.screenshot.findFirst({ where: { auditId: id, viewport: capture.viewport } });
      if (existing) {
        await db.screenshot.update({
          where: { id: existing.id },
          data: { kind: 'viewport', storageUrl: capture.storageKey, mimeType: 'image/png' },
        });
      } else {
        await db.screenshot.create({
          data: { auditId: id, viewport: capture.viewport, kind: 'viewport', storageUrl: capture.storageKey, mimeType: 'image/png' },
        });
      }

      if (audit.pages[0]) {
        await db.pageSnapshot.create({
          data: {
            pageId: audit.pages[0].id,
            viewport: capture.viewport,
            screenshotUrl: '/api/audits/' + id + '/screenshots/' + capture.viewport,
          },
        });
      }
    }

    if (!captures.length) {
      return NextResponse.json({
        error: 'SCREENSHOT_CAPTURE_FAILED',
        message: 'The audit report is still available, but the browser could not capture screenshots. The target may block automated access; no image has been fabricated.',
      }, { status: 502 });
    }

    return NextResponse.json({
      auditId: id,
      captured: captures.length,
      screenshots: captures.map(item => item.viewport),
      message: captures.length === 2 ? 'Desktop and mobile screenshots were stored privately.' : 'A partial screenshot capture succeeded. Retry to capture any missing viewport.',
    });
  } catch (error) {
    console.error('pagefix_screenshot_request_failed', {
      auditId: id,
      message: error instanceof Error ? error.message : 'SCREENSHOT_CAPTURE_FAILED',
    });
    return NextResponse.json({
      error: 'SCREENSHOT_CAPTURE_FAILED',
      message: 'The report is available, but screenshot capture failed. Try again later.',
    }, { status: 502 });
  }
}
