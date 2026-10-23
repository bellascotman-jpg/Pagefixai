import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const schema = z.object({
  channel: z.enum(['paid_ad', 'social', 'landing_page', 'product_page']),
  productFacts: z.string().trim().min(20).max(3000),
  visualDirection: z.string().trim().min(3).max(500),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED', message: 'Sign in to generate visual concepts.' }, { status: 401 });
  const key = process.env.OPENAI_API_KEY || process.env.AI_PROVIDER_KEY;
  if (!key) return NextResponse.json({ error: 'AI_PROVIDER_NOT_CONFIGURED', message: 'Image generation requires OPENAI_API_KEY or AI_PROVIDER_KEY on the server.' }, { status: 503 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Choose a channel and provide verified product facts and a visual direction.' }, { status: 400 });

  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recent = await db.usageEvent.count({ where: { userId: user.id, operation: 'creative_studio_image', createdAt: { gte: hourAgo } } });
  if (recent >= 5) return NextResponse.json({ error: 'RATE_LIMITED', message: 'The workspace limit is five image concepts per hour. Try again later.' }, { status: 429 });

  const channelDescription = {
    paid_ad: 'a polished paid-social advertising visual, square 1:1 composition, strong focal point, clear visual hierarchy, designed to support a short ad headline that will be added separately',
    social: 'a premium organic social content visual, square 1:1 composition, authentic editorial styling, strong visual storytelling',
    landing_page: 'a wide hero visual for a high-quality commercial landing page, 16:9 composition, generous negative space for real headline text to be overlaid separately',
    product_page: 'a clean ecommerce product-page hero visual, square 1:1 composition, accurate product presentation and neutral premium art direction',
  }[parsed.data.channel];

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      signal: AbortSignal.timeout(50000),
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1',
        size: parsed.data.channel === 'landing_page' ? '1536x1024' : '1024x1024',
        quality: 'medium',
        n: 1,
        prompt: [
          'Create one original marketing visual concept. Channel: ' + channelDescription + '.',
          'Verified product facts: ' + parsed.data.productFacts,
          'Art direction: ' + parsed.data.visualDirection,
          'Use only visual details supported by the product facts. Do not invent logos, certifications, product packaging, endorsements, results, pricing, statistics, testimonials or guarantees.',
          'Do not render any words, letters, numbers, logos, watermarks or interface text in the image. Leave headline and CTA text for accessible HTML overlays. Do not imitate a named living artist or copy an existing campaign.',
        ].join('\n\n'),
      }),
    });
    const payload = await response.json() as { data?: Array<{ b64_json?: string; revised_prompt?: string }>; error?: { message?: string } };
    const encoded = payload.data?.[0]?.b64_json;
    if (!response.ok || !encoded) return NextResponse.json({ error: 'IMAGE_PROVIDER_ERROR', message: payload.error?.message || 'The image provider did not return an image. No image was saved.' }, { status: 502 });
    await db.usageEvent.create({ data: { userId: user.id, operation: 'creative_studio_image', provider: 'openai', model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1', units: 0 } }).catch(() => undefined);
    return NextResponse.json({ imageDataUrl: 'data:image/png;base64,' + encoded, revisedPrompt: payload.data?.[0]?.revised_prompt || null, note: 'AI-generated visual concept. Review product accuracy, licensing and ad-policy compliance before publication.' });
  } catch (error) {
    return NextResponse.json({ error: 'IMAGE_GENERATION_FAILED', message: error instanceof Error && error.name === 'TimeoutError' ? 'Image generation timed out. Try again with a shorter brief.' : 'Image generation failed. Check the server AI provider configuration and try again.' }, { status: 502 });
  }
}
