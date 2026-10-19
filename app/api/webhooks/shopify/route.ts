import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { decryptCredentials } from '@/lib/store-integrations/crypto';
import { applyWebhookProduct, normalizeShopDomain, verifyWebhookSignature, type StoreCredentials, type CatalogProduct } from '@/lib/store-integrations/providers';

export const runtime = 'nodejs';

type ShopifyWebhookProduct = {
  admin_graphql_api_id?: string; id?: number | string; title?: string; handle?: string; status?: string;
  vendor?: string; product_type?: string; variants?: { price?: string }[]; total_inventory?: number;
  image?: { src?: string }; body_html?: string; updated_at?: string;
};

export async function POST(request: Request) {
  const rawBody = await request.text();
  const domainHeader = request.headers.get('x-shopify-shop-domain');
  const topic = request.headers.get('x-shopify-topic') || '';
  const eventId = request.headers.get('x-shopify-webhook-id');
  if (!domainHeader || !topic || !eventId || rawBody.length > 2_000_000) return NextResponse.json({ error: 'INVALID_WEBHOOK' }, { status: 400 });
  let domain: string;
  try { domain = normalizeShopDomain(domainHeader); } catch { return NextResponse.json({ error: 'INVALID_DOMAIN' }, { status: 400 }); }
  const integration = await db.storeIntegration.findUnique({ where: { platform_shopDomain: { platform: 'SHOPIFY', shopDomain: domain } } });
  if (!integration) return NextResponse.json({ error: 'UNKNOWN_STORE' }, { status: 404 });
  if (integration.status === 'DISCONNECTED') return NextResponse.json({ ok: true, ignored: true });
  let credentials: StoreCredentials;
  try { credentials = decryptCredentials<StoreCredentials>(integration.encryptedCredentials); } catch { return NextResponse.json({ error: 'CREDENTIALS_UNAVAILABLE' }, { status: 503 }); }
  if (!verifyWebhookSignature(rawBody, request.headers.get('x-shopify-hmac-sha256'), credentials.webhookSecret)) return NextResponse.json({ error: 'INVALID_SIGNATURE' }, { status: 401 });

  const providerEventId = `shopify:${eventId}`;
  try {
    await db.webhookEvent.create({ data: { provider: 'shopify', providerEventId, payload: { topic, domain, body: JSON.parse(rawBody) } } });
  } catch {
    const duplicate = await db.webhookEvent.findUnique({ where: { provider_providerEventId: { provider: 'shopify', providerEventId } }, select: { processedAt: true } });
    if (duplicate?.processedAt) return NextResponse.json({ ok: true, duplicate: true });
    if (!duplicate) return NextResponse.json({ error: 'EVENT_PERSISTENCE_FAILED' }, { status: 503 });
  }

  try {
    const p = JSON.parse(rawBody) as ShopifyWebhookProduct;
    const externalId = String(p.admin_graphql_api_id || (p.id != null ? `gid://shopify/Product/${p.id}` : ''));
    if (!externalId) return NextResponse.json({ error: 'PRODUCT_ID_MISSING' }, { status: 400 });
    if (topic.endsWith('/products/delete')) await applyWebhookProduct(integration.id, null, externalId);
    else {
      const variant = Array.isArray(p.variants) ? p.variants[0] : null;
      const product: CatalogProduct = {
        externalId, title: String(p.title || 'Untitled product'), handle: p.handle || null,
        url: p.handle ? `https://${domain}/products/${p.handle}` : null, status: p.status || null,
        vendor: p.vendor || null, productType: p.product_type || null, price: variant?.price ? String(variant.price) : null,
        currency: null, inventoryQuantity: Number.isFinite(p.total_inventory) ? p.total_inventory : null,
        imageUrl: p.image?.src || null, descriptionHtml: p.body_html || null,
        externalUpdatedAt: p.updated_at ? new Date(p.updated_at) : null, rawData: p,
      };
      await applyWebhookProduct(integration.id, product, externalId);
    }
    await db.webhookEvent.update({ where: { provider_providerEventId: { provider: 'shopify', providerEventId } }, data: { processedAt: new Date() } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'WEBHOOK_PROCESSING_FAILED' }, { status: 500 });
  }
}
