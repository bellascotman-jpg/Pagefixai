import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { decryptCredentials } from '@/lib/store-integrations/crypto';
import { applyWebhookProduct, normalizeShopDomain, verifyWebhookSignature, type StoreCredentials, type CatalogProduct } from '@/lib/store-integrations/providers';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const rawBody = await request.text();
  const source = request.headers.get('x-wc-webhook-source');
  const topic = request.headers.get('x-wc-webhook-topic') || '';
  const eventId = request.headers.get('x-wc-webhook-id');
  if (!source || !topic || !eventId || rawBody.length > 2_000_000) return NextResponse.json({ error: 'INVALID_WEBHOOK' }, { status: 400 });
  let domain: string;
  try { domain = normalizeShopDomain(source); } catch { return NextResponse.json({ error: 'INVALID_DOMAIN' }, { status: 400 }); }
  const integration = await db.storeIntegration.findUnique({ where: { platform_shopDomain: { platform: 'WOOCOMMERCE', shopDomain: domain } } });
  if (!integration || integration.status === 'DISCONNECTED') return NextResponse.json({ error: 'UNKNOWN_STORE' }, { status: 404 });
  let credentials: StoreCredentials;
  try { credentials = decryptCredentials<StoreCredentials>(integration.encryptedCredentials); } catch { return NextResponse.json({ error: 'CREDENTIALS_UNAVAILABLE' }, { status: 503 }); }
  if (!verifyWebhookSignature(rawBody, request.headers.get('x-wc-webhook-signature'), credentials.webhookSecret)) return NextResponse.json({ error: 'INVALID_SIGNATURE' }, { status: 401 });
  const providerEventId = `woocommerce:${eventId}`;
  try {
    await db.webhookEvent.create({ data: { provider: 'woocommerce', providerEventId, payload: { topic, domain, body: JSON.parse(rawBody) } } });
  } catch {
    const duplicate = await db.webhookEvent.findUnique({ where: { provider_providerEventId: { provider: 'woocommerce', providerEventId } }, select: { processedAt: true } });
    if (duplicate?.processedAt) return NextResponse.json({ ok: true, duplicate: true });
    if (!duplicate) return NextResponse.json({ error: 'EVENT_PERSISTENCE_FAILED' }, { status: 503 });
  }
  try {
    const p = JSON.parse(rawBody) as Record<string, any>;
    if (p.id == null) return NextResponse.json({ error: 'PRODUCT_ID_MISSING' }, { status: 400 });
    const externalId = String(p.id);
    if (topic.endsWith('.deleted')) await applyWebhookProduct(integration.id, null, externalId);
    else {
      const product: CatalogProduct = {
        externalId, title: String(p.name || 'Untitled product'), handle: p.slug || null, url: p.permalink || null,
        status: p.status || null, vendor: null, productType: p.type || null, price: p.price ? String(p.price) : null,
        currency: p.currency || null, inventoryQuantity: Number.isFinite(p.stock_quantity) ? p.stock_quantity : null,
        imageUrl: p.images?.[0]?.src || null, descriptionHtml: p.description || null,
        externalUpdatedAt: p.date_modified_gmt ? new Date(p.date_modified_gmt) : null, rawData: p,
      };
      await applyWebhookProduct(integration.id, product, externalId);
    }
    await db.webhookEvent.update({ where: { provider_providerEventId: { provider: 'woocommerce', providerEventId } }, data: { processedAt: new Date() } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'WEBHOOK_PROCESSING_FAILED' }, { status: 500 });
  }
}
