# Commerce store integrations

## Initial supported platforms

- Shopify Admin GraphQL API (2025-10): product catalogue import and product create/update/delete webhooks.
- WooCommerce REST API v3: product catalogue import and product.created/product.updated/product.deleted webhooks.
- Other commerce providers are not enabled until their API authentication, webhook signatures, pagination, and update behavior are implemented and tested.

## Connection requirements

Set `APP_URL` to the public HTTPS production origin and configure a random `AUTH_SECRET` of at least 32 characters. The application derives an AES-256-GCM encryption key from `AUTH_SECRET`; API credentials are stored encrypted in PostgreSQL and are never returned to the client. Rotate `AUTH_SECRET` only with a planned credential re-encryption process, because changing it makes stored integration credentials unreadable.

Shopify: create a custom app and grant read access to products/inventory plus webhook write access. Enter the Admin API access token and the Shopify app client secret used to verify webhook HMAC signatures. Do not grant product write access for monitoring alone.

WooCommerce: create a REST API key with read/write access so PageFix can register webhooks. Enter its consumer key, consumer secret, and a strong webhook signing secret. PageFix uses the REST API to read products and create product-change webhooks; it does not access orders, customers, or payment records.

## Monitoring behavior

The initial sync imports up to 1,000 products per connection (10 pages of 100) and persists product metadata, price/currency where available, stock quantity, image, description and public URL. Webhooks apply product changes incrementally. A daily Vercel Cron reconciliation calls `POST /api/integrations/stores/sync` with `CRON_SECRET`; keep this secret server-side. Each sync is recorded in `StoreSyncRun`, and provider failures set integration status to `DEGRADED` rather than pretending it is healthy.

Webhook endpoints:
- `POST /api/webhooks/shopify`
- `POST /api/webhooks/woocommerce`

Webhook signatures are verified against the raw request body before any catalogue mutation. Provider event IDs are unique for idempotency. The dashboard shows catalogue data-quality counts for up to 500 sampled products per store; these counts are not full-store counts when a catalogue exceeds that sample size.

## Security and limitations

- Store domains are validated through the existing audit URL safety validator before credential verification.
- Credentials are encrypted at rest with AES-256-GCM and never included in API responses.
- Disconnecting marks the integration disconnected and erases its encrypted credential blob. Stored catalogue history remains for the owner.
- This release monitors product catalogue quality and synchronizes changes. It does not silently rewrite live product copy, change prices, edit themes, publish products, place orders, or touch checkout/payment settings. Any automated write action must be a separate explicit, permission-checked, auditable approval with a before/after record.
- Cron availability depends on the connected Vercel plan and deployment configuration. Webhooks provide near-real-time product events when provider registration succeeds; daily sync is a reconciliation safety net, not a substitute for provider webhooks.
- Initial connection and webhook registration must be verified against real credentials in a staging store before claiming a particular merchant is connected.
