# PageFix AI

**Find what's getting in the way of the sale.**

PageFix AI is an evidence-driven ecommerce purchase-friction intelligence platform. The product architecture separates browser evidence and deterministic analysis from AI interpretation.

## Engineering status

The repository has been initialized with the production foundation: Next.js/React/TypeScript application shell, strict TypeScript configuration, PostgreSQL/Prisma domain schema, stable billing plan identifiers, payment-provider abstraction, health endpoint, Vitest configuration, and GitHub CI.

The repository is intentionally built incrementally. No production credential, payment success, customer, analytics value, audit result, or AI response is fabricated.

## Local development

1. Copy `.env.example` to `.env.local`.
2. Provide a PostgreSQL `DATABASE_URL` and required service credentials for the features being enabled.
3. Install dependencies with `npm ci` after a lockfile is generated for the chosen dependency versions.
4. Generate the Prisma client with `npx prisma generate`.
5. Apply migrations with `npx prisma migrate dev` during development.
6. Run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` before deployment.

## Architecture

- `app/` — Next.js application and HTTP routes
- `lib/` — stable domain utilities and provider boundaries
- `prisma/` — PostgreSQL schema and future migrations
- `audit-engine/` — browser acquisition, extraction, deterministic checks, evidence, findings, and prioritization
- `ai/` — schema-validated AI interpretation and QA
- `billing/` — Flutterwave integration, payment verification, subscriptions, and entitlements
- `jobs/` — durable audit/background processing
- `reports/` — professional report generation and sharing
- `founder/` and `admin/` — server-authorized operational interfaces
- `tests/` and `e2e/` — automated verification

## Security principles

The application must never trust client-side plan state, payment-return query parameters, local storage roles, or arbitrary submitted prices. Payment access is granted only after server-side provider verification and idempotent webhook/transaction processing. Audit targets are subject to SSRF controls before browser acquisition.

## Environment

See `.env.example`. Never commit `.env`, API keys, Flutterwave secrets, authentication secrets, database credentials, or private keys.
