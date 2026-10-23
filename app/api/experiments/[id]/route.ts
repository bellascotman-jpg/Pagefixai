import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';
const schema = z.object({ status: z.enum(['RUNNING', 'PAUSED', 'DRAFT']) });

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  const { id } = await context.params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
  const existing = await db.experiment.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  const experiment = await db.experiment.update({ where: { id }, data: { status: parsed.data.status } });
  return NextResponse.json({ experiment });
}
