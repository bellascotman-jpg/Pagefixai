# Security model

- Passwords use Node scrypt with per-password random salts.
- Sessions are opaque random tokens stored hashed in PostgreSQL and sent in HttpOnly, Secure-in-production, SameSite cookies.
- Protected APIs resolve the current user from the server session.
- Organization ownership is checked through memberships; client-side role or plan values are never authoritative.
- Audit targets are SSRF-validated before browser acquisition.
- Flutterwave webhooks require the configured `verif-hash` and transactions are verified server-side.
- Webhook processing is idempotent through a provider/event unique constraint.
- Prices and plan IDs are server-owned.
- Security headers are set centrally in `next.config.ts`.
- Secrets are environment variables only.
- Sensitive founder/admin actions must be recorded in `AdminEvent` as those surfaces expand.
