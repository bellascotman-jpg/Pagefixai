import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { applyApprovedProductFix } from '@/lib/store-integrations/providers';

export const runtime = 'nodejs';
export const maxDuration = 30;

const schema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  descriptionHtml: z.string().max(50000).optional(),
}).refine(value => value.title !== undefined || value.descriptionHtml !== undefined, { message: 'Provide a title or description change.' });

export async function POST(request: Request, context: { params: Promise<{ integrationId: string; productId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  const { integrationId, productId } = await context.params;
  const ownedIntegration = await db.storeIntegration.findFirst({ where: { id: integrationId, userId: user.id }, select: { id: true } });
  if (!ownedIntegration) return NextResponse.json({ error: 'INTEGRATION_NOT_FOUND' }, { status: 404 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Provide a valid product title and/or description.' }, { status: 400 });
  try {
    const result = await applyApprovedProductFix({ integrationId, localProductId: productId, actorId: user.id, ...parsed.data });
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'PRODUCT_FIX_FAILED';
    const status = code === 'PRODUCT_NOT_FOUND' ? 404 : code === 'INVALID_PRODUCT_TITLE' || code === 'PRODUCT_DESCRIPTION_TOO_LONG' || code === 'NO_CHANGES_PROVIDED' || code === 'NO_CHANGES_DETECTED' ? 400 : 502;
    return NextResponse.json({ error: code, message: status === 502 ? 'The store did not confirm the product update. Check write permissions and store API health; PageFix has not reported the change as applied.' : code }, { status });
  }
}
