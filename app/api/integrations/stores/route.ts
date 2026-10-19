import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { encryptCredentials } from '@/lib/store-integrations/crypto';
import { normalizeShopDomain, verifyStoreCredentials, registerStoreWebhooks, syncIntegration, type StoreCredentials } from '@/lib/store-integrations/providers';
import { validateAuditUrl } from '@/lib/audit/ssrf';

export const runtime = 'nodejs';
export const maxDuration = 60;

const connectSchema = z.object({
  platform: z.enum(['SHOPIFY', 'WOOCOMMERCE']),
  storeUrl: z.string().url().max(2048),
  projectName: z.string().trim().min(2).max(100).default('My Store'),
  accessToken: z.string().trim().min(8).max(1000).optional(),
  consumerKey: z.string().trim().min(8).max(1000).optional(),
  consumerSecret: z.string().trim().min(8).max(1000).optional(),
  webhookSecret: z.string().trim().min(8).max(1000),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  const integrations = await db.storeIntegration.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, platform: true, shopDomain: true, status: true, webhookStatus: true, webhookLastError: true, scopes: true, lastSyncedAt: true, lastWebhookAt: true, lastError: true, createdAt: true, store: { select: { id: true, name: true, url: true } }, _count: { select: { products: true, syncRuns: true } } },
  });
  return NextResponse.json({ integrations });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  const parsed = connectSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Provide a store URL, platform credentials and a webhook signing secret.' }, { status: 400 });

  const input = parsed.data;
  let domain: string;
  try {
    domain = normalizeShopDomain(input.storeUrl);
    await validateAuditUrl(`https://${domain}`);
  } catch {
    return NextResponse.json({ error: 'INVALID_STORE_URL', message: 'Enter a public HTTPS store domain that can be reached safely.' }, { status: 400 });
  }

  const credentials: StoreCredentials = input.platform === 'SHOPIFY'
    ? { accessToken: input.accessToken, webhookSecret: input.webhookSecret }
    : { consumerKey: input.consumerKey, consumerSecret: input.consumerSecret, webhookSecret: input.webhookSecret };

  try {
    const storeInfo = await verifyStoreCredentials(input.platform, domain, credentials);
    const existing = await db.storeIntegration.findUnique({ where: { platform_shopDomain: { platform: input.platform, shopDomain: domain } }, select: { id: true, userId: true } });
    if (existing && existing.userId !== user.id) {
      return NextResponse.json({ error: 'STORE_ALREADY_CONNECTED', message: 'This store is already connected to another PageFix account.' }, { status: 409 });
    }

    let storeId: string;
    if (existing) {
      const integration = await db.storeIntegration.findUnique({ where: { id: existing.id }, select: { storeId: true } });
      if (!integration) return NextResponse.json({ error: 'STORE_CONFIGURATION_ERROR' }, { status: 500 });
      storeId = integration.storeId;
      await db.storeIntegration.update({ where: { id: existing.id }, data: { encryptedCredentials: encryptCredentials(credentials), status: 'CONNECTED', lastError: null } });
    } else {
      const membership = await db.membership.findFirst({ where: { userId: user.id, role: { in: ['OWNER', 'ADMIN'] } }, orderBy: { id: 'asc' }, select: { organizationId: true } });
      if (!membership) return NextResponse.json({ error: 'WORKSPACE_NOT_CONFIGURED', message: 'Your workspace needs an owner or admin membership before connecting a store.' }, { status: 409 });
      const project = await db.project.create({ data: { organizationId: membership.organizationId, name: input.projectName } });
      const store = await db.store.create({ data: { projectId: project.id, name: storeInfo.name || domain, url: `https://${domain}` } });
      storeId = store.id;
      await db.storeIntegration.create({ data: { userId: user.id, storeId, platform: input.platform, shopDomain: domain, encryptedCredentials: encryptCredentials(credentials), scopes: input.platform === 'SHOPIFY' ? ['read_products', 'read_inventory', 'write_webhooks'] : ['read_write_products', 'webhooks'] } });
    }

    const integration = await db.storeIntegration.findUnique({ where: { platform_shopDomain: { platform: input.platform, shopDomain: domain } }, select: { id: true } });
    if (!integration) return NextResponse.json({ error: 'INTEGRATION_SAVE_FAILED' }, { status: 500 });
    let webhooks: { status: string; topics: string[] } | null = null;
    let webhookWarning: string | null = null;
    try {
      webhooks = await registerStoreWebhooks(input.platform, domain, credentials);
      await db.storeIntegration.update({ where: { id: integration.id }, data: { webhookStatus: 'REGISTERED', webhookLastError: null } });
    } catch (error) {
      webhookWarning = error instanceof Error ? error.message : 'WEBHOOK_REGISTRATION_FAILED';
      await db.storeIntegration.update({ where: { id: integration.id }, data: { webhookStatus: 'FAILED', webhookLastError: webhookWarning } });
    }
    const sync = await syncIntegration(integration.id, 'initial_connect');
    return NextResponse.json({ ok: true, integrationId: integration.id, store: { name: storeInfo.name, domain, platform: input.platform, currency: storeInfo.currency }, webhooks, webhookWarning, sync }, { status: 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'STORE_CONNECT_FAILED';
    const safeMessages: Record<string, string> = {
      SHOPIFY_ACCESS_TOKEN_REQUIRED: 'Provide a Shopify Admin API access token with product read access.',
      WOOCOMMERCE_KEYS_REQUIRED: 'Provide WooCommerce consumer key and secret.',
      INTEGRATION_ENCRYPTION_NOT_CONFIGURED: 'Server-side credential encryption is not configured. Contact the administrator.',
      INVALID_STORE_URL: 'The store URL is invalid.',
      INVALID_STORE_DOMAIN: 'Use a public store domain, not a local address.',
    };
    console.error('pagefix_store_connect_failed', { platform: input.platform, domain, code });
    return NextResponse.json({ error: code, message: safeMessages[code] || 'The store could not be verified or synced. Check API credentials, permissions and the store API, then retry.' }, { status: 422 });
  }
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  const body = await request.json().catch(() => null) as { integrationId?: unknown } | null;
  if (!body || typeof body.integrationId !== 'string') return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
  const integration = await db.storeIntegration.findFirst({ where: { id: body.integrationId, userId: user.id }, select: { id: true } });
  if (!integration) return NextResponse.json({ error: 'INTEGRATION_NOT_FOUND' }, { status: 404 });
  await db.storeIntegration.update({ where: { id: integration.id }, data: { status: 'DISCONNECTED', encryptedCredentials: '', lastError: null } });
  return NextResponse.json({ ok: true });
}
