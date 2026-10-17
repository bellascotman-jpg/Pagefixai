import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';

const patchSchema = z.object({
  status: z.enum(['ACTIVE', 'NEEDS_REVIEW', 'CLARIFIED', 'ARCHIVED']).optional(),
  context: z.string().trim().max(2000).optional(),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  const { id } = await context.params;
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 }); }
  const parsed = patchSchema.safeParse(payload);
  if (!parsed.success || (!parsed.data.status && parsed.data.context === undefined)) return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
  const existing = await db.promiseClaim.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  const claim = await db.promiseClaim.update({
    where: { id },
    data: {
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
      ...(parsed.data.context !== undefined ? { context: parsed.data.context || null } : {}),
      ...(parsed.data.status === 'CLARIFIED' ? { lastCheckedAt: new Date() } : {}),
    },
  });
  return NextResponse.json({ claim });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  const { id } = await context.params;
  const result = await db.promiseClaim.deleteMany({ where: { id, userId: user.id } });
  if (!result.count) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  return NextResponse.json({ deleted: true });
}
