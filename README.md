# PageFix AI

**Find what's breaking the customer journey.**

PageFix AI is an evidence-led website diagnostics product for ecommerce pages, product pages and landing pages. It captures browser-visible evidence, runs deterministic checks, prioritizes supported findings and provides practical remediation guidance.

## Product principles

- Every finding must be tied to browser-observed evidence or clearly labeled as a risk, hypothesis or recommendation.
- Never fabricate analytics, rankings, revenue, traffic, conversion rates, reviews, customer data or business outcomes.
- A public URL audit does not reveal private revenue, traffic quality, margins, conversion rates or checkout abandonment.
- Screenshots and stored evidence must only be described as available when they have actually been persisted and can be retrieved.
- A fresh recheck is a new inspection; it must not silently overwrite an earlier audit.
- Fast audit mode inspects one desktop viewport, avoids waiting for network-idle, and publishes deterministic findings before optional AI enrichment. Third-party sites may block automated inspection; blocked captures must be reported honestly.
- Only audit websites the operator is authorized to inspect.

## Stack

- Next.js App Router, React and TypeScript
- PostgreSQL and Prisma
- Optional private S3-compatible storage for desktop/mobile audit screenshots
- Playwright for browser-based page inspection
- Zod for input and AI-output validation
- Flutterwave transaction verification for billing
- Vitest and Playwright tests
- GitHub Actions quality checks

## Local development

1. Copy .env.example to .env.local.
2. Configure DATABASE_URL for a PostgreSQL database.
3. Set a long random AUTH_SECRET, INTERNAL_JOB_SECRET and CRON_SECRET.
4. Install dependencies using npm install.
5. Generate the Prisma client using npx prisma generate.
6. Apply the schema to a development database using npx prisma db push.
7. Run npm run typecheck, npm run lint, npm test, npm run build and npm run e2e.

A production deployment requires configured database, environment variables and a browser runtime compatible with Playwright. Do not expose secrets in client-side variables or commit .env.local.

## Environment variables

See .env.example. Optional AI, payment, email and screenshot-storage integrations remain unavailable until their real credentials and provider settings are configured and verified. Screenshot persistence uses STORAGE_ENDPOINT, STORAGE_REGION, STORAGE_ACCESS_KEY, STORAGE_SECRET_KEY and STORAGE_BUCKET; images are served through an owner-authorized API route, not a public object URL. ChatGPT subscriptions do not provide an API key automatically.

## Main application areas

- app/ — marketing site, authentication, pricing, dashboard and API routes
- components/ — client-side audit and status components
- lib/audit/ — URL validation and browser audit engine
- lib/ai/ — schema-constrained evidence interpretation
- lib/billing/ — plan entitlements and payment provider integration
- lib/jobs/ — queued audit processing
- prisma/ — PostgreSQL domain schema
- tests/ and e2e/ — automated checks
- docs/ — architecture, security, provider and verification notes

## Billing

Three public monthly subscription choices are available in the product UI: Starter ($49/month), Growth ($149/month) and Agency ($399/month). A custom plan is a contact-sales path, not an automatic checkout. New accounts receive a seven-day Starter trial. The historic annual and founding_lifetime plan identifiers remain in the schema and plan definitions to preserve old records and existing entitlements, but they are not offered for new checkout. Public prices, server-side amounts, seeded monthly allowances and plan entitlements must remain synchronized.

Founder/admin access is based on server-side roles, not a frontend email check. The reserved founder account is wisdomfrankceo@gmail.com; provision it securely through the configured server-side seed process and a unique password.

## Security notes

- Never trust client-side plan state or payment-return query parameters.
- Grant paid access only after provider-side transaction verification and idempotent webhook processing.
- Validate URL targets before browser acquisition and revalidate network requests, including redirect destinations.
- Store credentials only in server-side environment variables.
- Review tenant isolation, rate limits, resource limits, session expiry and background-job behavior before public launch.

## Verification status

A commit or generated UI is not proof of a successful build. See docs/BUILD-STATUS.md for checks that have and have not been executed.
