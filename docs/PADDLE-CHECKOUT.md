# Paddle checkout setup

PageFix AI supports Paddle Billing as the preferred hosted checkout for international SaaS subscriptions. The customer is taken to a Paddle.js-enabled PageFix checkout bridge; card details are handled by Paddle and are never collected or stored by PageFix. The existing Flutterwave checkout remains available until Paddle is fully configured.

## Before switching production traffic

1. Create and verify a Paddle seller account. Live processing requires Paddle's approval.
2. In Paddle, create the PageFix AI product and three monthly recurring USD prices: Starter ($49), Growth ($149), and Agency ($399). Use monthly billing cycles and copy each price ID.
3. Add the production domain `pagefixai.vercel.app` as an approved checkout domain and set the default checkout URL to `https://pagefixai.vercel.app/billing/checkout`.
4. Create a Paddle API key with transaction read/write permissions, a client-side token, and a notification destination pointing to `https://pagefixai.vercel.app/api/webhooks/paddle`.
5. Subscribe the notification destination to `transaction.completed`, `subscription.created`, `subscription.updated`, and `subscription.canceled`. Copy its endpoint secret.
6. Configure the environment variables below in Vercel for the same environment. Start with Paddle sandbox keys and sandbox price IDs. Use `PADDLE_ENVIRONMENT=live` and live credentials only after sandbox webhook testing.
7. Set `APP_URL=https://pagefixai.vercel.app` in production. Do not share or commit any secret keys.

Required variables:
- `PADDLE_API_KEY`
- `PADDLE_CLIENT_TOKEN`
- `PADDLE_WEBHOOK_SECRET`
- `PADDLE_PRICE_STARTER_MONTHLY`
- `PADDLE_PRICE_GROWTH_MONTHLY`
- `PADDLE_PRICE_AGENCY_MONTHLY`
- `PADDLE_ENVIRONMENT=sandbox` or `live`

Paddle becomes the checkout provider only when all required Paddle variables are present. If they are incomplete, the current Flutterwave flow remains active rather than leaving checkout completely unavailable. The Paddle webhook validates the signed raw request, checks the configured price ID and completed transaction status, processes events idempotently, and updates subscriptions and entitlements only from verified provider events.

## Important limitations

- This code cannot open or verify a Paddle seller account on the founder's behalf. Account approval, banking details, tax/KYC information, product prices and webhook setup must be completed in Paddle.
- A successful GitHub build does not prove live payment collection or bank payouts. Test a sandbox purchase and webhook delivery, then make a small live transaction before launch.
- Paddle's availability and payout eligibility remain subject to its current country rules, account review and payout settings. Never misstate business location or identity to a payment provider.
