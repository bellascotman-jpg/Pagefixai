# PageFix AI — Paddle Billing Setup

PageFix uses Paddle Billing for monthly Starter ($49), Growth ($149), and Agency ($399) subscriptions. The application code does not contain Paddle credentials and must not be configured with invented/test values in production.

## 1. Create the catalog in Paddle Sandbox

1. Open the Paddle dashboard and switch to **Sandbox**.
2. Create three products: PageFix AI Starter, PageFix AI Growth, and PageFix AI Agency.
3. Create one **monthly recurring USD price** for each product: $49, $149, and $399.
4. Copy each price ID (it starts with `pri_`).

## 2. Create API and client-side credentials

In Paddle **Sandbox → Developer tools / Authentication**:
- Create a sandbox API key with permission to create transactions and read the catalog.
- Create a client-side token for Paddle.js. Sandbox client-side tokens start with `test_`.

Keep the API key and webhook secret private. Only the client-side token is intended for browser use.

## 3. Configure the payment link

In Paddle Sandbox, add and approve the website domain used for checkout. Set the default payment link to:

`https://pagefixai.vercel.app/billing/checkout`

The application also passes this checkout page when creating each transaction. Paddle appends the `_ptxn` transaction parameter to this page, and Paddle.js opens the matching checkout automatically.

For a separate preview domain, approve that domain in the sandbox and use it as `APP_URL` for the Preview environment.

## 4. Configure the webhook destination

Create a webhook/notification destination with this URL:

`https://pagefixai.vercel.app/api/webhooks/paddle`

Subscribe to:
- `transaction.completed`
- `subscription.created`
- `subscription.updated`
- `subscription.canceled`

Copy the destination's **endpoint secret key** into `PADDLE_WEBHOOK_SECRET`. Do not use the API key or client-side token as the webhook secret.

## 5. Add Vercel environment variables

Add these to the PageFix AI Vercel project. Start with **Preview** and **Sandbox** credentials; only switch Production to live credentials after successful sandbox testing.

| Variable | Value |
| --- | --- |
| `BILLING_PROVIDER` | `paddle` |
| `PADDLE_ENVIRONMENT` | `sandbox` for testing; `live` for production |
| `PADDLE_API_KEY` | Paddle API key for the matching environment |
| `PADDLE_CLIENT_TOKEN` | Paddle client-side token for the matching environment |
| `PADDLE_WEBHOOK_SECRET` | Webhook destination secret for the matching environment |
| `PADDLE_PRICE_STARTER_MONTHLY` | Starter monthly price ID (`pri_...`) |
| `PADDLE_PRICE_GROWTH_MONTHLY` | Growth monthly price ID (`pri_...`) |
| `PADDLE_PRICE_AGENCY_MONTHLY` | Agency monthly price ID (`pri_...`) |
| `APP_URL` | The approved site origin, e.g. `https://pagefixai.vercel.app` |

Use the same environment consistently: sandbox API key + sandbox token + sandbox prices + sandbox webhook secret. Do not mix sandbox and live credentials.

## 6. Sandbox acceptance checklist

- Each pricing button creates a Paddle transaction and opens Paddle Checkout.
- A successful sandbox payment produces `transaction.completed`.
- The webhook returns HTTP 200 and records a processed event.
- The matching user receives the correct plan, subscription, and feature entitlements.
- Replaying the same event does not duplicate payments or affiliate commissions.
- Subscription updates and cancellations change subscription/entitlement state correctly.
- Invalid webhook signatures return HTTP 401 and do not change account access.
- Failed checkout and canceled checkout do not grant paid access.

## Important

Checkout is deliberately configured to default to Paddle. If Paddle credentials or price IDs are missing, the API returns a setup message instead of silently routing customers to a different payment provider. Do not switch to live mode until the sandbox acceptance checklist passes.
