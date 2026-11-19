# Implementation Plan: Security Hardening

> **Status:** COMPLETED (approved 2026-11-19 incl. major upgrades — §5 now in scope)

## 0. As-built deviations

- Auth lives in `tenant.middleware.ts` + `utils/verify-clerk-token.util.ts` (no separate `auth.middleware.ts`); uses `@clerk/backend` `verifyToken` with `authorizedParties: [FRONTEND_URL]`. `@clerk/express` not needed.
- No Next.js `middleware.ts`: data protection is enforced by the backend; added `AuthControls` (modal sign-in, org switcher) in the Navbar instead, rendered only when a Clerk key exists.
- Token read from `window.Clerk.session.getToken()` (`frontend/src/lib/auth-headers.ts`) because `ClerkProvider` is conditional.
- Extra finding fixed: Neon TLS had `rejectUnauthorized: false` → now `true`.
- Extra: 5xx responses no longer echo internal error text; unused browser-side `simulateWebhookReply` removed.
- `next` stays on 15.5.29; its nested vulnerable `postcss` is forced to ^8.5.30 via `overrides.postcss = "$postcss"`.
- Upgrades: puppeteer 25.16.0 (25.18.1 skipped — <2 weeks old), drizzle-orm 0.45.4, drizzle-kit 0.31.11, zod 4.6.7.
- Result: `npm audit` 0 vulnerabilities in both apps.
> **Created:** 2026-11-19 UTC

## 1. Scope

Fix the audit findings below without changing product behaviour for legitimate users.

| # | Severity | Finding | Fix |
|---|---|---|---|
| 1 | Critical | API trusts client `x-workspace-id`; no auth | Verify Clerk session JWT on every tenant route; derive `workspaceId` from the token's active org (`orgId`), `userId` from `sub`. Header ignored. |
| 2 | Critical | Webhook unauthenticated, `workspaceId` from body | HMAC-SHA256 signature over raw body (`x-webhook-signature`), `crypto.timingSafeEqual`, reject if `WEBHOOK_SECRET` unset. |
| 3 | Critical | `next` advisory | `npm audit fix` in frontend (in-range). |
| 4 | High | Any socket joins any workspace room | Socket.io auth middleware verifies the Clerk token in the handshake; socket auto-joins only its own `workspace:<orgId>` room; `join:workspace` removed. |
| 5 | High | `SET LOCAL ... = $1` invalid → RLS never set | `SELECT set_config('app.current_workspace_id', $1, true)`. |
| 6 | High | Fail-open `ws_dev_default` | Dev bypass only when `NODE_ENV=development` **and** `CLERK_SECRET_KEY` empty, with a startup warning. Server refuses to boot in production without `CLERK_SECRET_KEY` / `WEBHOOK_SECRET`. |
| 7 | High | `body-parser`, `qs` advisories | `npm audit fix` (in-range). Major upgrades (`puppeteer`, `drizzle-orm`, `zod`) handled separately — see §5. |
| 8 | Medium | No security headers / rate limits; 10 MB body; Puppeteer can fetch arbitrary URLs | `helmet`; `express-rate-limit` (global + stricter on `/api/ai`, `/api/leads/generate`); body limit 1 MB; Puppeteer request interception blocks all non-`data:` network requests. |
| — | Cleanup | Hardcoded `localhost:3001` CORS origin | Remove; `FRONTEND_URL` in `.env` now covers it. |

## 2. Files

**New (backend):** `src/middleware/auth.middleware.ts`, `src/middleware/rate-limit.middleware.ts`, `src/middleware/webhook-signature.middleware.ts`, `src/utils/verify-clerk-token.util.ts`
**Modified (backend):** `src/middleware/tenant.middleware.ts`, `src/routes/index.ts`, `src/routes/webhooks.routes.ts`, `src/services/socket.service.ts`, `src/config/db.ts`, `src/config/env.ts`, `src/server.ts`, `src/services/brochure.service.ts`, `.env.example`, tests.
**New (frontend):** `src/middleware.ts` (Clerk), `src/lib/api-client.ts` (attaches `Authorization: Bearer <token>`).
**Modified (frontend):** `src/lib/events.api.ts`, `src/lib/ai-provider.api.ts`, other `src/lib/*.api.ts`, socket client hook.
**Deps:** backend `@clerk/express`, `helmet`, `express-rate-limit`; frontend uses existing `@clerk/nextjs`.

## 3. API contract changes

- Tenant routes: `Authorization: Bearer <Clerk session token>` required; `x-workspace-id` no longer honoured.
- Webhook: `x-webhook-signature: sha256=<hex HMAC of raw body>` required.
- Socket.io: `auth: { token }` in handshake; server-assigned room.

## 4. Order

1. DB `set_config` fix + env validation (prod fail-closed).
2. Backend auth + tenant middleware, routes wiring.
3. Webhook signature.
4. Socket.io auth.
5. helmet, rate limit, body limit, Puppeteer interception, CORS cleanup.
6. Frontend Clerk middleware + authed API client + socket token.
7. `npm audit fix` (in-range) both apps.
8. Tests: auth required (401 without token), webhook rejects bad/missing signature, valid signature accepted, `set_config` call shape. tsc + Vitest loop; docs; push.

## 5. Out of scope / follow-up

Major-version upgrades (`puppeteer` 25, `drizzle-orm` 0.45, `zod` 4) carry breaking API changes — separate task with its own test pass.
