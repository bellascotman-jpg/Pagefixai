import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(320),
  website: z.string().trim().max(500).optional().default(''),
  audience: z.string().trim().min(5).max(2000),
  channel: z.enum(['creator', 'agency', 'consultant', 'technology', 'publisher', 'other']),
  consent: z.literal(true),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Please complete the required fields and confirm the program terms.' }, { status: 400 });
  try {
    await db.feedback.create({ data: { type: 'PAGEFIX_AFFILIATE_APPLICATION', message: parsed.data.audience, metadata: { name: parsed.data.name, email: parsed.data.email.toLowerCase(), website: parsed.data.website, channel: parsed.data.channel, status: 'PENDING_REVIEW', commissionRateRequested: 25, consentAt: new Date().toISOString() } } });
    return NextResponse.json({ ok: true, message: 'Application received. We will review it before activating affiliate payouts.' }, { status: 201 });
  } catch (error) {
    console.error('affiliate_application_error', error);
    return NextResponse.json({ error: 'APPLICATION_UNAVAILABLE', message: 'We could not save your application right now. Please email wisdomfrankceo@gmail.com.' }, { status: 503 });
  }
}
