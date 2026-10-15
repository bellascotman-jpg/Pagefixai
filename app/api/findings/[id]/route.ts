import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db';

const schema = z.object({ status: z.enum(['OPEN','IN_PROGRESS','COMPLETED','RECHECK_REQUIRED']) });

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED', message: 'Sign in to update a finding.' }, { status: 401 });
  const { id } = await context.params;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Choose a valid remediation status.' }, { status: 400 });
  const finding = await db.finding.findFirst({ where: { id, audit: { userId: user.id } }, select: { id: true } });
  if (!finding) return NextResponse.json({ error: 'NOT_FOUND', message: 'Finding not found.' }, { status: 404 });
  const updated = await db.finding.update({ where: { id }, data: { status: parsed.data.status }, select: { id: true, status: true } });
  return NextResponse.json({ finding: updated });
}
