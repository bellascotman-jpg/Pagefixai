# Flutterwave billing

PageFix uses Flutterwave as its only payment provider.

## Flow

1. User selects a stable plan ID on `/pricing`.
2. Server validates the plan ID and reads the price from `lib/plans.ts`.
3. Server creates Flutterwave Standard checkout using the configured secret key.
4. Flutterwave redirects the customer after checkout.
5. The webhook at `/api/webhooks/flutterwave` validates `verif-hash`.
6. The server verifies the transaction against Flutterwave before granting value.
7. The server validates transaction reference, customer email, currency and amount.
8. A unique webhook event is stored to make retries idempotent.
9. Payment, subscription and entitlements are updated transactionally.

Flutterwave recommends secret-hash webhook verification, server-side transaction verification and idempotent webhook processing. See the current official documentation before changing this integration.

## Required environment

- `FLUTTERWAVE_PUBLIC_KEY`
- `FLUTTERWAVE_SECRET_KEY`
- `FLUTTERWAVE_WEBHOOK_SECRET`
- `BILLING_CURRENCY`
- `APP_URL`

Never accept a browser-submitted price or currency as authoritative.
