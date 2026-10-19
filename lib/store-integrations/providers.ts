import { createHmac, timingSafeEqual } from 'node:crypto';
import { db } from '@/lib/db';
import { decryptCredentials } from '@/lib/store-integrations/crypto';
import { validateAuditUrl } from '@/lib/audit/ssrf';

export type StoreCredentials = { accessToken?: string; consumerKey?: string; consumerSecret?: string; webhookSecret?: string };
export type CatalogProduct = {
  externalId: string; title: string; handle?: string | null; url?: string | null; status?: string | null;
  vendor?: string | null; productType?: string | null; price?: string | null; currency?: string | null;
  inventoryQuantity?: number | null; imageUrl?: string | null; descriptionHtml?: string | null;
  externalUpdatedAt?: Date | null; rawData?: unknown;
};

export function normalizeShopDomain(input: string) {
  let url: URL;
  try { url = new URL(input.includes('://') ? input : 'https://' + input); } catch { throw new Error('INVALID_STORE_URL'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.port || url.search || url.hash) throw new Error('INVALID_STORE_URL');
  const host = url.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || !host.includes('.')) throw new Error('INVALID_STORE_DOMAIN');
  return host;
}

function shopifyApi(domain: string, token: string) {
  return { endpoint: `https://${domain}/admin/api/2026-10/graphql.json`, headers: { 'content-type': 'application/json', 'x-shopify-access-token': token } };
}

async function shopifyGraphql<T>(domain: string, token: string, query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const api = shopifyApi(domain, token);
  const response = await fetch(api.endpoint, { method: 'POST', headers: api.headers, body: JSON.stringify({ query, variables }), signal: AbortSignal.timeout(20000), cache: 'no-store' });
  if (!response.ok) throw new Error(`SHOPIFY_API_HTTP_${response.status}`);
  const body = await response.json() as { data?: T; errors?: { message?: string }[] };
  if (!body.data || body.errors?.length) throw new Error('SHOPIFY_API_QUERY_FAILED');
  return body.data;
}

export async function verifyStoreCredentials(platform: 'SHOPIFY' | 'WOOCOMMERCE', domain: string, credentials: StoreCredentials) {
  await validateAuditUrl(`https://${domain}`);
  if (platform === 'SHOPIFY') {
    if (!credentials.accessToken) throw new Error('SHOPIFY_ACCESS_TOKEN_REQUIRED');
    const data = await shopifyGraphql<{ shop: { name: string; myshopifyDomain: string; currencyCode: string } }>(domain, credentials.accessToken, 'query { shop { name myshopifyDomain currencyCode } }');
    return { name: data.shop.name || domain, currency: data.shop.currencyCode, domain: data.shop.myshopifyDomain || domain };
  }
  if (!credentials.consumerKey || !credentials.consumerSecret) throw new Error('WOOCOMMERCE_KEYS_REQUIRED');
  const auth = Buffer.from(`${credentials.consumerKey}:${credentials.consumerSecret}`).toString('base64');
  const response = await fetch(`https://${domain}/wp-json/wc/v3/system_status`, { headers: { authorization: `Basic ${auth}`, accept: 'application/json' }, signal: AbortSignal.timeout(20000), cache: 'no-store' });
  if (!response.ok) throw new Error(`WOOCOMMERCE_API_HTTP_${response.status}`);
  return { name: domain, currency: 'UNKNOWN', domain };
}

function asDate(value: unknown): Date | null {
  if (typeof value !== 'string' || !value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function fetchCatalog(platform: 'SHOPIFY' | 'WOOCOMMERCE', domain: string, credentials: StoreCredentials): Promise<CatalogProduct[]> {
  await validateAuditUrl(`https://${domain}`);
  if (platform === 'SHOPIFY') {
    const products: CatalogProduct[] = [];
    let cursor: string | null = null;
    for (let page = 0; page < 10; page++) {
      const data = await shopifyGraphql<{ products: { nodes: any[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } } }>(
        domain, credentials.accessToken!,
        'query Products($after: String) { products(first: 100, after: $after) { nodes { id title handle status vendor productType descriptionHtml updatedAt onlineStoreUrl totalInventory featuredImage { url } priceRangeV2 { minVariantPrice { amount currencyCode } } } pageInfo { hasNextPage endCursor } } }',
        { after: cursor },
      );
      for (const p of data.products.nodes) products.push({
        externalId: String(p.id), title: p.title, handle: p.handle, url: p.onlineStoreUrl || `https://${domain}/products/${p.handle}`,
        status: p.status, vendor: p.vendor, productType: p.productType, price: p.priceRangeV2?.minVariantPrice?.amount ?? null,
        currency: p.priceRangeV2?.minVariantPrice?.currencyCode ?? null, inventoryQuantity: Number.isFinite(p.totalInventory) ? p.totalInventory : null,
        imageUrl: p.featuredImage?.url ?? null, descriptionHtml: p.descriptionHtml ?? null, externalUpdatedAt: asDate(p.updatedAt), rawData: p,
      });
      if (!data.products.pageInfo.hasNextPage || !data.products.pageInfo.endCursor) break;
      cursor = data.products.pageInfo.endCursor;
    }
    return products;
  }

  const auth = Buffer.from(`${credentials.consumerKey}:${credentials.consumerSecret}`).toString('base64');
  const products: CatalogProduct[] = [];
  for (let page = 1; page <= 10; page++) {
    const response = await fetch(`https://${domain}/wp-json/wc/v3/products?per_page=100&page=${page}`, { headers: { authorization: `Basic ${auth}`, accept: 'application/json' }, signal: AbortSignal.timeout(20000), cache: 'no-store' });
    if (!response.ok) throw new Error(`WOOCOMMERCE_API_HTTP_${response.status}`);
    const rows = await response.json() as any[];
    for (const p of rows) products.push({
      externalId: String(p.id), title: String(p.name ?? 'Untitled product'), handle: p.slug ?? null, url: p.permalink ?? null,
      status: p.status ?? null, vendor: null, productType: p.type ?? null, price: p.price ? String(p.price) : null,
      currency: typeof p.currency === 'string' ? p.currency : null, inventoryQuantity: Number.isFinite(p.stock_quantity) ? p.stock_quantity : null,
      imageUrl: p.images?.[0]?.src ?? null, descriptionHtml: p.description ?? null, externalUpdatedAt: asDate(p.date_modified_gmt ?? p.date_modified), rawData: p,
    });
    if (rows.length < 100) break;
  }
  return products;
}

export async function syncIntegration(integrationId: string, trigger = 'manual') {
  const integration = await db.storeIntegration.findUnique({ where: { id: integrationId } });
  if (!integration || integration.status === 'DISCONNECTED') throw new Error('INTEGRATION_NOT_AVAILABLE');
  const run = await db.storeSyncRun.create({ data: { integrationId, trigger, status: 'RUNNING' } });
  try {
    const credentials = decryptCredentials<StoreCredentials>(integration.encryptedCredentials);
    const catalog = await fetchCatalog(integration.platform, integration.shopDomain, credentials);
    let changed = 0;
    for (const p of catalog) {
      const before = await db.storeProduct.findUnique({ where: { integrationId_externalId: { integrationId, externalId: p.externalId } }, select: { title: true, status: true, price: true, inventoryQuantity: true, descriptionHtml: true } });
      const after = {
        title: p.title, handle: p.handle ?? null, url: p.url ?? null, status: p.status ?? null, vendor: p.vendor ?? null,
        productType: p.productType ?? null, price: p.price && Number.isFinite(Number(p.price)) ? p.price : null,
        currency: p.currency ?? null, inventoryQuantity: p.inventoryQuantity ?? null, imageUrl: p.imageUrl ?? null,
        descriptionHtml: p.descriptionHtml ?? null, rawData: p.rawData as any, externalUpdatedAt: p.externalUpdatedAt, lastSeenAt: new Date(),
      };
      if (!before || before.title !== after.title || before.status !== after.status || String(before.price ?? '') !== String(after.price ?? '') || before.inventoryQuantity !== after.inventoryQuantity || before.descriptionHtml !== after.descriptionHtml) changed++;
      await db.storeProduct.upsert({ where: { integrationId_externalId: { integrationId, externalId: p.externalId } }, create: { integrationId, externalId: p.externalId, ...after }, update: after });
    }
    await db.storeIntegration.update({ where: { id: integrationId }, data: { status: 'CONNECTED', lastSyncedAt: new Date(), lastError: null } });
    await db.storeSyncRun.update({ where: { id: run.id }, data: { status: 'COMPLETED', productsSeen: catalog.length, productsChanged: changed, completedAt: new Date() } });
    return { runId: run.id, productsSeen: catalog.length, productsChanged: changed };
  } catch (error) {
    const code = error instanceof Error ? error.message.slice(0, 120) : 'SYNC_FAILED';
    await db.storeIntegration.update({ where: { id: integrationId }, data: { status: 'DEGRADED', lastError: code } }).catch(() => undefined);
    await db.storeSyncRun.update({ where: { id: run.id }, data: { status: 'FAILED', errorCode: code, completedAt: new Date() } }).catch(() => undefined);
    throw error;
  }
}

export function verifyWebhookSignature(rawBody: string, signature: string | null, secret: string | undefined) {
  if (!signature || !secret) return false;
  const expected = createHmac('sha256', secret).update(rawBody).digest('base64');
  const a = Buffer.from(expected); const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function applyWebhookProduct(integrationId: string, product: CatalogProduct | null, externalId: string) {
  const integration = await db.storeIntegration.findUnique({ where: { id: integrationId }, select: { id: true, status: true } });
  if (!integration || integration.status === 'DISCONNECTED') return;
  if (!product) {
    await db.storeProduct.deleteMany({ where: { integrationId, externalId } });
  } else {
    const data = { title: product.title, handle: product.handle ?? null, url: product.url ?? null, status: product.status ?? null, vendor: product.vendor ?? null, productType: product.productType ?? null, price: product.price && Number.isFinite(Number(product.price)) ? product.price : null, currency: product.currency ?? null, inventoryQuantity: product.inventoryQuantity ?? null, imageUrl: product.imageUrl ?? null, descriptionHtml: product.descriptionHtml ?? null, rawData: product.rawData as any, externalUpdatedAt: product.externalUpdatedAt, lastSeenAt: new Date() };
    await db.storeProduct.upsert({ where: { integrationId_externalId: { integrationId, externalId } }, create: { integrationId, externalId, ...data }, update: data });
  }
  await db.storeIntegration.update({ where: { id: integrationId }, data: { lastWebhookAt: new Date(), lastError: null } });
}

export async function getIntegrationCredentials(integrationId: string) {
  const integration = await db.storeIntegration.findUnique({ where: { id: integrationId } });
  if (!integration) return null;
  return { integration, credentials: decryptCredentials<StoreCredentials>(integration.encryptedCredentials) };
}

export async function registerStoreWebhooks(platform: 'SHOPIFY' | 'WOOCOMMERCE', domain: string, credentials: StoreCredentials) {
  await validateAuditUrl(`https://${domain}`);
  const appUrl = process.env.APP_URL?.replace(/\/$/, '');
  if (!appUrl || !appUrl.startsWith('https://')) throw new Error('APP_URL_HTTPS_REQUIRED');
  if (!credentials.webhookSecret) throw new Error('WEBHOOK_SECRET_REQUIRED');
  const topics = platform === 'SHOPIFY'
    ? ['PRODUCTS_CREATE', 'PRODUCTS_UPDATE', 'PRODUCTS_DELETE']
    : ['product.created', 'product.updated', 'product.deleted'];

  if (platform === 'SHOPIFY') {
    const query = 'query { webhookSubscriptions(first: 100) { nodes { topic endpoint { ... on WebhookHttpEndpoint { callbackUrl } } } } }';
    const existing = await shopifyGraphql<{ webhookSubscriptions: { nodes: { topic: string; endpoint: { callbackUrl?: string } }[] } }>(domain, credentials.accessToken!, query);
    const callbackUrl = appUrl + '/api/webhooks/shopify';
    const have = new Set(existing.webhookSubscriptions.nodes.filter(n => n.endpoint?.callbackUrl === callbackUrl).map(n => n.topic));
    for (const topic of topics) {
      if (have.has(topic)) continue;
      const mutation = 'mutation CreateWebhook($topic: WebhookSubscriptionTopic!, $callbackUrl: URL!) { webhookSubscriptionCreate(topic: $topic, webhookSubscription: { callbackUrl: $callbackUrl, format: JSON }) { webhookSubscription { id } userErrors { message } } }';
      const result = await shopifyGraphql<{ webhookSubscriptionCreate: { webhookSubscription: { id: string } | null; userErrors: { message: string }[] } }>(domain, credentials.accessToken!, mutation, { topic, callbackUrl });
      if (result.webhookSubscriptionCreate.userErrors.length || !result.webhookSubscriptionCreate.webhookSubscription) throw new Error('SHOPIFY_WEBHOOK_REGISTRATION_FAILED');
    }
    return { status: 'REGISTERED', topics };
  }

  const auth = Buffer.from(`${credentials.consumerKey}:${credentials.consumerSecret}`).toString('base64');
  const base = `https://${domain}/wp-json/wc/v3/webhooks`;
  const headers = { authorization: `Basic ${auth}`, 'content-type': 'application/json', accept: 'application/json' };
  const listResponse = await fetch(`${base}?per_page=100`, { headers, signal: AbortSignal.timeout(20000), cache: 'no-store' });
  if (!listResponse.ok) throw new Error(`WOOCOMMERCE_WEBHOOK_LIST_HTTP_${listResponse.status}`);
  const existing = await listResponse.json() as { topic?: string; delivery_url?: string; status?: string }[];
  const callbackUrl = appUrl + '/api/webhooks/woocommerce';
  for (const topic of topics) {
    if (existing.some(item => item.topic === topic && item.delivery_url === callbackUrl && item.status === 'active')) continue;
    const response = await fetch(base, { method: 'POST', headers, body: JSON.stringify({ name: `PageFix ${topic}`, topic, delivery_url: callbackUrl, secret: credentials.webhookSecret, status: 'active' }), signal: AbortSignal.timeout(20000), cache: 'no-store' });
    if (!response.ok) throw new Error(`WOOCOMMERCE_WEBHOOK_CREATE_HTTP_${response.status}`);
  }
  return { status: 'REGISTERED', topics };
}

export async function applyApprovedProductFix(input: {
  integrationId: string; localProductId: string; actorId: string; title?: string; descriptionHtml?: string;
}) {
  const integration = await db.storeIntegration.findUnique({ where: { id: input.integrationId } });
  if (!integration || integration.status === 'DISCONNECTED') throw new Error('INTEGRATION_NOT_AVAILABLE');
  const product = await db.storeProduct.findFirst({ where: { id: input.localProductId, integrationId: integration.id } });
  if (!product) throw new Error('PRODUCT_NOT_FOUND');
  const title = input.title?.trim();
  const descriptionHtml = input.descriptionHtml === undefined ? undefined : input.descriptionHtml.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  if (title !== undefined && (!title || title.length > 255)) throw new Error('INVALID_PRODUCT_TITLE');
  if (descriptionHtml !== undefined && descriptionHtml.length > 50000) throw new Error('PRODUCT_DESCRIPTION_TOO_LONG');
  if (title === undefined && descriptionHtml === undefined) throw new Error('NO_CHANGES_PROVIDED');

  await validateAuditUrl(`https://${integration.shopDomain}`);
  const credentials = decryptCredentials<StoreCredentials>(integration.encryptedCredentials);
  const changes: Record<string, string> = {};
  if (title !== undefined && title !== product.title) changes.title = title;
  if (descriptionHtml !== undefined && descriptionHtml !== (product.descriptionHtml ?? '')) changes.descriptionHtml = descriptionHtml;
  if (Object.keys(changes).length === 0) throw new Error('NO_CHANGES_DETECTED');

  if (integration.platform === 'SHOPIFY') {
    const productInput: Record<string, string> = { id: product.externalId, ...changes };
    const result = await shopifyGraphql<{ productUpdate: { product: { id: string } | null; userErrors: { message: string }[] } }>(
      integration.shopDomain, credentials.accessToken!,
      'mutation UpdateProduct($product: ProductUpdateInput!) { productUpdate(product: $product) { product { id } userErrors { message } } }',
      { product: productInput },
    );
    if (result.productUpdate.userErrors.length || !result.productUpdate.product) throw new Error('SHOPIFY_PRODUCT_UPDATE_FAILED');
  } else {
    const auth = Buffer.from(`${credentials.consumerKey}:${credentials.consumerSecret}`).toString('base64');
    const payload: Record<string, string> = {};
    if (changes.title !== undefined) payload.name = changes.title;
    if (changes.descriptionHtml !== undefined) payload.description = changes.descriptionHtml;
    const response = await fetch(`https://${integration.shopDomain}/wp-json/wc/v3/products/${encodeURIComponent(product.externalId)}`, {
      method: 'PUT', headers: { authorization: `Basic ${auth}`, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(payload), signal: AbortSignal.timeout(20000), cache: 'no-store',
    });
    if (!response.ok) throw new Error(`WOOCOMMERCE_PRODUCT_UPDATE_HTTP_${response.status}`);
  }

  const after = {
    title: changes.title ?? product.title,
    descriptionHtml: changes.descriptionHtml ?? product.descriptionHtml,
  };
  await db.$transaction(async tx => {
    await tx.storeProduct.update({ where: { id: product.id }, data: { title: after.title, descriptionHtml: after.descriptionHtml, lastSeenAt: new Date() } });
    await tx.storeProductChangeLog.create({
      data: {
        integrationId: integration.id, externalId: product.externalId, actorId: input.actorId,
        action: 'APPROVED_PRODUCT_CONTENT_UPDATE',
        beforeJson: { title: product.title, descriptionHtml: product.descriptionHtml },
        afterJson: after,
      },
    });
  });
  return { productId: product.id, externalId: product.externalId, before: { title: product.title, descriptionHtml: product.descriptionHtml }, after };
}
