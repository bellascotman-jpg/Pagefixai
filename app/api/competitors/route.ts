import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { validateAuditUrl } from '@/lib/audit/ssrf';

const schema = z.object({ url: z.string().url().max(2048), name: z.string().trim().max(100).optional() });

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED', message: 'Sign in to add a competitor.' }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Enter a valid public competitor URL.' }, { status: 400 });
  try {
    const url = await validateAuditUrl(parsed.data.url);
    const membership = await db.membership.findFirst({ where: { userId: user.id }, orderBy: { id: 'asc' } });
    if (!membership) return NextResponse.json({ error: 'WORKSPACE_NOT_FOUND', message: 'Your account does not have a workspace yet.' }, { status: 409 });
    let project = await db.project.findFirst({ where: { organizationId: membership.organizationId }, orderBy: { createdAt: 'asc' } });
    if (!project) project = await db.project.create({ data: { organizationId: membership.organizationId, name: 'Competitor Research' } });
    const competitor = await db.competitor.create({ data: { projectId: project.id, url: url.toString(), name: parsed.data.name || new URL(url).hostname.replace(/^www\./, '') } });
    return NextResponse.json({ competitor }, { status: 201 });
  } catch (error) {
    console.error('competitor_create_error', { name: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ error: 'COMPETITOR_CREATE_FAILED', message: 'We could not add that URL. Confirm it is a public website and try again.' }, { status: 400 });
  }
}
