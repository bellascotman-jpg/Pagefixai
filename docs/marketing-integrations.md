# PageFix AI — marketing and experiment integrations

## Current workflows

- Shopify and WooCommerce: API-key connection, catalogue sync, webhook registration where permitted, product-quality review, and approved product title/description fixes.
- Meta Ads: OAuth authorization for ad-read and ad-management scopes, encrypted token storage, account/campaign read sync. Publishing or editing campaigns is not enabled by this connection workflow.
- Google Marketing: OAuth authorization for Google Ads, GA4 read-only and Search Console read-only. Google Ads campaign queries require a developer token.
- Creative Studio: text variants plus optional generated visual concepts. Assets are drafts and are not uploaded to ad platforms.
- First-party A/B testing: two text variants on one CSS selector, stable browser assignment, impression/click events and an explicit conversion callback. Statistical significance and automatic winner selection are not implemented.

## Vercel environment variables

Required for OAuth token encryption and signed state:
- `AUTH_SECRET` — existing strong server-side secret (at least 32 characters).
- `APP_URL` — production origin, e.g. `https://your-production-domain.example`.

Meta:
- `META_APP_ID`
- `META_APP_SECRET`

Google:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_ADS_DEVELOPER_TOKEN` — required only for Google Ads API queries.
- Optional `GOOGLE_ADS_API_VERSION`, defaults to `v23`.

AI:
- `OPENAI_API_KEY` or `AI_PROVIDER_KEY` — server-side key used for text and image generation.
- Optional `OPENAI_MODEL` and `OPENAI_IMAGE_MODEL`.

Never put provider secrets in browser code or expose them in client-visible environment variables.

## Provider callback URLs

Register these exact production callback URLs in each provider's developer console:

- Meta: `https://your-production-domain.example/api/integrations/oauth/meta_ads/callback`
- Google: `https://your-production-domain.example/api/integrations/oauth/google_marketing/callback`

The preview environment uses its own preview origin. Provider consoles must explicitly allow that exact callback URL before OAuth can complete in preview. Provider app review/testing restrictions still apply.

## Database and deployment

The Prisma schema now includes `Experiment`, `ExperimentEvent`, and `MarketingConnection`. The production build script runs additive Prisma schema synchronization on production deployment; preview deployments intentionally skip schema synchronization to avoid mutating production data during review. Therefore a preview can compile before these tables exist in its runtime database. Use an isolated preview database with schema sync enabled before testing database-backed workflows end to end. Do not point a preview schema sync at the production database merely to make preview work.

## A/B test snippet

Install the generated `<script>` on the target page only after reviewing the test. The script changes text in the selected element while the experiment is running. Call `window.pagefixTrackConversion()` only after a real conversion success event; do not call it on page load. The current release reports observed event counts and rates; it does not claim statistical significance or automatically declare a winner.
