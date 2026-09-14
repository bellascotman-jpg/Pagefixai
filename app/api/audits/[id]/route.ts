import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  const { id } = await context.params;
  const audit = await db.audit.findFirst({ where: { id, userId: user.id }, include: { findings: { include: { evidence: { include: { evidence: true } }, fix: true }, orderBy: [{ priority: 'asc' }, { severity: 'asc' }] }, evidence: true, reports: true, jobs: { orderBy: { createdAt: 'desc' }, take: 1 } } });
  if (!audit) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  return NextResponse.json({ audit });
}
