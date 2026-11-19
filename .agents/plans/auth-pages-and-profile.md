# Implementation Plan: Sign-up, Login, Forgot/Change Password & Profile Page

> **Status:** PENDING_USER_AUTHORIZATION
> **Created:** 2026-11-19 UTC · **Revised:** 2026-11-19 (split by side per AGENTS.md Rule 13; added backend sync + profile API)

## 1. Scope

| Flow | Where it runs | How |
|---|---|---|
| Sign up (email + password, email verification code) | Frontend page `/sign-up` | Clerk `<SignUp />` |
| Login | Frontend page `/sign-in` | Clerk `<SignIn />` |
| Forgot password (reset code → new password) | `/sign-in` → "Forgot password?" | built into `<SignIn />` |
| Change password | `/profile` → Security tab | built into `<UserProfile />` |
| Profile page (name, avatar, emails, sessions, delete account + workspace plan/credits/role/AI provider) | Frontend `/profile`, data from Backend `GET /api/me` | `<UserProfile />` + summary card |
| Keep our DB in step with Clerk (users, workspaces, memberships) | Backend `POST /api/webhooks/clerk` | Clerk webhook, signature-verified |

**Passwords never reach our backend.** Hashing, reset codes, breached-password checks, lockout and email verification stay inside Clerk.

**Why backend work is needed:** today nothing inserts `users`, `workspaces` or `workspace_members`. After real sign-ups, a new organization has no `workspaces` row, so every lead / event / campaign insert fails its foreign key. The Clerk webhook sync fixes this. Workspace plan, credits, role and AI provider live only in our DB, so the profile page reads them through `GET /api/me`.

---

## 2. Backend (`/backend`)

### 2.1 New files
| File | Purpose |
|---|---|
| `src/routes/me.routes.ts` | `GET /api/me` (tenant-authenticated): returns the signed-in user + active workspace |
| `src/services/profile.service.ts` | Reads `users`, `workspaces`, `workspace_members` for the current user/workspace (via `withTenantContext`) |
| `src/routes/clerk-webhooks.routes.ts` | `POST /api/webhooks/clerk`: verifies the Svix signature with `@clerk/backend/webhooks` `verifyWebhook`, dispatches events |
| `src/services/clerk-sync.service.ts` | Idempotent upserts / deletes for the events in §2.3 |
| `src/types/profile-response.interface.ts` | `ProfileResponse` |
| `src/routes/__tests__/me.test.ts` | `/api/me` auth + response shape |
| `src/routes/__tests__/clerk-webhooks.test.ts` | rejects unsigned / bad-signature; each event calls the right sync |

### 2.2 Modified files
| File | Change |
|---|---|
| `src/routes/index.ts` | Mount `/api/me` behind `tenantMiddleware`; mount `/api/webhooks/clerk` **before** the generic webhook signature middleware (Clerk uses its own Svix signature) |
| `src/config/env.ts` | Add `CLERK_WEBHOOK_SIGNING_SECRET`; required in production when Clerk is enabled |
| `.env.example` / `.env` | Add `CLERK_WEBHOOK_SIGNING_SECRET=` |

### 2.3 API contract
- `GET /api/me` → `200 { success, data: { user: { id, email, firstName, lastName, avatarUrl, createdAt }, workspace: { id, name, plan, creditsRemaining, aiProvider, role } | null } }`; `401` without a valid token.
- `POST /api/webhooks/clerk` → `200` processed, `400` invalid signature. Handled events:
  - `user.created` / `user.updated` → upsert `users`
  - `user.deleted` → delete `users` (cascades memberships)
  - `organization.created` / `organization.updated` → upsert `workspaces` (`ownerUserId` = `created_by`)
  - `organization.deleted` → delete `workspaces` (cascades tenant data)
  - `organizationMembership.created` / `.updated` → upsert `workspace_members` (role)
  - `organizationMembership.deleted` → delete `workspace_members`
- Workspace/membership writes run in `withTenantContext(orgId)` so RLS policies apply; `users` has no RLS.

### 2.4 Database
No schema changes — existing `users`, `workspaces`, `workspace_members` tables are used as defined.

---

## 3. Frontend (`/frontend`)

### 3.1 New files
| File | Purpose |
|---|---|
| `src/lib/clerk-enabled.ts` | Single `clerkEnabled` flag (replaces the local copy in `Navbar.tsx`) |
| `src/lib/clerk-appearance.ts` | Clerk `appearance` themed from `.agents/design.md` tokens (obsidian background, glass cards, Sky 600 primary) |
| `src/lib/profile.api.ts` | `getProfile()` → `GET /api/me` with the Bearer token |
| `src/types/profile.interface.ts` | Mirror of `ProfileResponse` (Rule 13 — mirrored, not shared) |
| `src/components/auth/auth-page-shell.tsx` | Centered radial-gradient layout + brand header for auth pages |
| `src/components/auth/auth-not-configured.tsx` | Panel shown when no Clerk key is configured |
| `src/components/profile/profile-summary-card.tsx` | Avatar, name, email, workspace, plan, credits, role, AI provider (from `getProfile()`) |
| `src/app/sign-in/[[...sign-in]]/page.tsx` | Login + forgot-password flow |
| `src/app/sign-up/[[...sign-up]]/page.tsx` | Sign-up flow |
| `src/app/profile/[[...profile]]/page.tsx` | Summary card + `<UserProfile routing="path" path="/profile" />` (change password lives here) |
| `src/middleware.ts` | `clerkMiddleware`: `/dashboard`, `/events/*`, `/profile/*` redirect to `/sign-in` when signed out; pass-through when Clerk not configured |

### 3.2 Modified files
| File | Change |
|---|---|
| `src/app/layout.tsx` | `ClerkProvider` gets `appearance`, `signInUrl`, `signUpUrl` |
| `src/components/navigation/AuthControls.tsx` | "Log in" / "Sign up" links (replacing the modal); `UserButton` gets a "Profile" link to `/profile` |
| `src/components/navigation/Navbar.tsx` | Use shared `clerkEnabled` |
| `.env.example` / `.env.local` | Re-add `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up` |

### 3.3 Keyless mode
Without `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: auth pages show the "Authentication isn't configured" panel, middleware gates nothing, `/profile` shows the dev workspace from `/api/me` (matches the backend dev bypass).

---

## 4. Clerk dashboard (manual, one-time)
- User & authentication → **Email** on, **Password** on, email verification code on.
- Organizations → enabled (each workspace is an org; the backend requires an active org).
- Webhooks → endpoint `https://<backend-host>/api/webhooks/clerk`, subscribe to the events in §2.3, copy the signing secret into `CLERK_WEBHOOK_SIGNING_SECRET`.

## 5. Order
1. **Backend:** env var → `clerk-sync.service` + `clerk-webhooks.routes` → `profile.service` + `me.routes` → router wiring → tests.
2. **Frontend:** shared flag, appearance, shell / not-configured → sign-in & sign-up pages → profile API, type, summary card, profile page → middleware → layout / Navbar / AuthControls → env vars.
3. Verify, docs (`task.md`, `memory.md`, `TASK_LOG.md`), push.

## 6. Verification
- **Backend:** `tsc --noEmit` 0 errors; Vitest: existing 17 + new `/api/me` and Clerk-webhook tests (unsigned → 400, valid signature → sync called, `/api/me` without token → 401).
- **Frontend:** `tsc --noEmit` 0 errors; keyless: `/sign-in`, `/sign-up`, `/profile` return 200, existing pages still 200.
- **With real Clerk keys (needs your keys, not testable before):** sign up → verify email → `/dashboard`; signed-out `/dashboard` → `/sign-in`; forgot password → reset → sign in; change password on `/profile`; webhook creates `users` / `workspaces` rows; profile card shows plan and credits.
