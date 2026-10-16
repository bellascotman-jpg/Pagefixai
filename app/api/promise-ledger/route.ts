import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';

export const runtime = 'nodejs';

const createSchema = z.object({
  title: z.string().trim().min(2).max(140),
  claimText: z.string().trim().min(3).max(5000),
  sourceType: z.enum(['AD', 'PRODUCT_PAGE', 'POLICY', 'SOCIAL_POST', 'EMAIL', 'OTHER']),
  sourceUrl: z.string().trim().url().max(2048).optional().or(z.literal('')),
  context: z.string().trim().max(2000).optional(),
  auditId: z.string().trim().optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  const claims = await db.promiseClaim.findMany({ where: { userId: user.id }, orderBy: { updatedAt: 'desc' }, take: 200 });
  return NextResponse.json({ claims }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: 'INVALID_JSON', message: 'Send a valid JSON request.' }, { status: 400 }); }
  const parsed = createSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Provide a title, claim text and source type.' }, { status: 400 });
  if (parsed.data.auditId) {
    const ownedAudit = await db.audit.findFirst({ where: { id: parsed.data.auditId, userId: user.id }, select: { id: true } });
    if (!ownedAudit) return NextResponse.json({ error: 'AUDIT_NOT_FOUND', message: 'The linked audit was not found in your account.' }, { status: 404 });
  }
  const claim = await db.promiseClaim.create({
    data: {
      userId: user.id,
      auditId: parsed.data.auditId || null,
      title: parsed.data.title,
      claimText: parsed.data.claimText,
      sourceType: parsed.data.sourceType,
      sourceUrl: parsed.data.sourceUrl || null,
      context: parsed.data.context || null,
    },
  });
  return NextResponse.json({ claim }, { status: 201 });
}
