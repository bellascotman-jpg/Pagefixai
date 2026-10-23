import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';
const createSchema = z.object({
  name: z.string().trim().min(3).max(120),
  targetUrlPattern: z.string().trim().min(1).max(500),
  selector: z.string().trim().min(1).max(300),
  controlText: z.string().trim().min(1).max(2000),
  variantText: z.string().trim().min(1).max(2000),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  let experiments;
  try { experiments = await db.experiment.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { events: { select: { variantKey: true, eventType: true } } },
  }); } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'P2021') return NextResponse.json({ experiments: [], schemaReady: false, message: 'The experiment tables are not provisioned in this preview database. Production schema sync is intentionally deferred until the production release.' });
    return NextResponse.json({ error: 'EXPERIMENTS_UNAVAILABLE', message: 'Could not load experiment data.' }, { status: 503 });
  }
  return NextResponse.json({ experiments: experiments.map(({ events, ...experiment }) => ({
    ...experiment,
    results: ['A', 'B'].map(variant => {
      const assigned = events.filter(event => event.variantKey === variant && event.eventType === 'impression').length;
      const conversions = events.filter(event => event.variantKey === variant && event.eventType === 'conversion').length;
      const clicks = events.filter(event => event.variantKey === variant && event.eventType === 'click').length;
      return { variant, impressions: assigned, clicks, conversions, conversionRate: assigned ? conversions / assigned : null };
    }),
  })) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Provide a test name, URL path, CSS selector, control text and variant B text.' }, { status: 400 });
  if (!parsed.data.targetUrlPattern.startsWith('/') || parsed.data.targetUrlPattern.startsWith('//')) {
    return NextResponse.json({ error: 'INVALID_TARGET', message: 'Use a same-site path such as /products/example. External URL targeting is not supported.' }, { status: 400 });
  }
  try { if (parsed.data.selector.length > 300 || parsed.data.selector.includes('<')) throw new Error(); } catch {
    return NextResponse.json({ error: 'INVALID_SELECTOR', message: 'Provide a CSS selector, not HTML.' }, { status: 400 });
  }
  let experiment;
  try { experiment = await db.experiment.create({
    data: { ...parsed.data, userId: user.id, publicKey: randomBytes(24).toString('base64url'), status: 'DRAFT' },
    select: { id: true, name: true, publicKey: true, targetUrlPattern: true, selector: true, controlText: true, variantText: true, status: true, createdAt: true },
  }); } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'P2021') return NextResponse.json({ error: 'SCHEMA_NOT_READY', message: 'The experiment database tables are not provisioned in this preview. Do not use this preview for live tests; the schema is added during the approved production schema sync.' }, { status: 503 });
    return NextResponse.json({ error: 'EXPERIMENT_CREATE_FAILED', message: 'Could not create the experiment.' }, { status: 503 });
  }
  return NextResponse.json({ experiment }, { status: 201 });
}
