import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { readAuditScreenshot } from '@/lib/storage/object-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, context: { params: Promise<{ id: string; viewport: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });

  const { id, viewport } = await context.params;
  if (!['desktop', 'mobile'].includes(viewport)) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

  const audit = await db.audit.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!audit) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

  const expectedKey = 'audits/' + id + '/' + viewport + '.png';
  const screenshot = await db.screenshot.findFirst({
    where: { auditId: id, viewport, storageUrl: expectedKey },
    select: { storageUrl: true, mimeType: true },
  });
  if (!screenshot?.storageUrl) return NextResponse.json({ error: 'SCREENSHOT_NOT_AVAILABLE' }, { status: 404 });

  try {
    const bytes = await readAuditScreenshot(screenshot.storageUrl);
    if (!bytes) return NextResponse.json({ error: 'SCREENSHOT_NOT_AVAILABLE' }, { status: 404 });
    return new Response(new Uint8Array(bytes), {
      status: 200,
      headers: {
        'Content-Type': screenshot.mimeType || 'image/png',
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    console.error('audit_screenshot_read_failed', { auditId: id, viewport });
    return NextResponse.json({ error: 'SCREENSHOT_STORAGE_UNAVAILABLE' }, { status: 502 });
  }
}
