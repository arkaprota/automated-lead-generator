# Implementation Plan: Remove All Demo Data (AGENTS.md Rule 14)

> **Status:** COMPLETED (approved 2026-11-19)
> **Created:** 2026-11-19 UTC

## 1. Scope

Delete every piece of fake, sample, or fabricated data from application code. Where demo data was standing in for a missing integration, return an honest error or empty state instead.

**Impact (important):** three integrations were simulated, not real. After this change they report "not configured" until real providers are connected (separate tasks):

| Integration | Before | After |
|---|---|---|
| Google Maps scraping | Always returned invented businesses (`Business 3 & Co.`, `*.example.com`, Park Street), even with `SCRAPER_API_KEY` set | `503 Lead scraper not configured` — lead generation and scheduled events produce no leads |
| Email dispatch worker | Logged a line and reported `sent: true` | Job fails with `Email provider not configured` |
| Brochure storage | Returned a fake `cdn.example-storage.com` URL | `503 Brochure storage not configured` |

Kept (allowed by Rule 14): deterministic logic on real input — null website → Hot Lead score, keyword reply classification, query templates built from the user's own demographic text; `__tests__/` fixtures; `.env.example` placeholders; input `placeholder="e.g. …"` hints.

---

## 2. Backend (`/backend`)

| File | Demo data removed | Replacement behaviour |
|---|---|---|
| `src/services/lead-scraper.service.ts` | Mock lead generator | Throws `IntegrationNotConfiguredError('scraper')` (provider integration is a follow-up) |
| `src/controllers/events.controller.ts` | Fake events (`evt_sample_1`, "Kolkata Restaurants Hunter"), fake lead (`spiceroute.example.com`), fake "success" on DB failure | DB errors → `503 Database unavailable`; empty list when there are no rows |
| `src/services/event-scheduler.service.ts` | Mock event when DB lookup fails; fabricated `newlyInsertedCount` on DB failure | Missing event → skip run; DB failure → job fails (BullMQ retries) |
| `src/routes/leads.routes.ts` | In-memory `lead_mock_*` response when DB is down | `503 Database unavailable`; scraper not configured → `503` |
| `src/routes/campaigns.routes.ts` | Invented `contact@<name>.example.com` recipient | Leads without a real email are skipped and counted in the response |
| `src/services/ai.service.ts` | `_warmLeadFallback` (invented 70/warm score), `_pitchFallback` (made-up "40%+", "3x–5x ROI" copy), invented strengths in `_hotLeadFallback` | AI unavailable → lead saved as `leadScore 0`, `unqualified`, reason "Not scored — AI provider not configured"; pitch → `503 AI provider not configured`; hot-lead heuristic keeps only facts from the record |
| `src/services/brochure.service.ts` | Fake storage URL; HTML returned as a "PDF" when Puppeteer fails | Upload → `IntegrationNotConfiguredError('storage')`; render failure → error |
| `src/services/queue.service.ts` | Fake `sent: true` | Throws `IntegrationNotConfiguredError('email')` |
| `src/config/gemini.ts`, `anthropic.ts`, `openai.ts` | `'dummy-dev-key'` credentials | Throw if constructed without a key (factory already checks `isConfigured()`) |
| `src/services/gemini.service.ts` | Unused legacy service full of fallback data | Delete file |

**New:** `src/errors/integration-not-configured.error.ts` (maps to HTTP 503 in `error.middleware.ts`).
**Tests:** `__tests__/` mock `LeadScraperService` / AI client with fixtures (allowed exception) and add cases: scraper unconfigured → 503, DB down → 503, no-key scoring → `unqualified`.
**Database:** no schema changes.

## 3. Frontend (`/frontend`)

| File | Demo data removed | Replacement |
|---|---|---|
| `src/app/dashboard/page.tsx` | Pre-filled "Web design clients in Kolkata"; `lead_mock_*` ids; fake `sample.pdf` brochure URL on error | Empty input (placeholder hint stays); real ids only; show the API error message |
| `src/components/events/EventCreateModal.tsx` | Pre-filled Restaurant / Kolkata / "Daily Restaurant Leads in Kolkata" | Empty fields (placeholder hints stay) |
| Pages calling the API | — | Show "not configured" / error messages returned by the backend (503) instead of silent fallbacks |

## 4. Order
1. Backend error class + error middleware mapping.
2. Remove backend demo data file by file (table §2); delete `gemini.service.ts`.
3. Update tests (fixtures in `__tests__/` only), add new cases.
4. Frontend clean-up (§3).
5. Verify: re-run the demo-data search (must return only allowed exceptions), `tsc` both apps, Vitest, live probes; docs; push.

## 5. As-built additions
- Also removed: invented sender profile ("Apex Growth Labs" / "Alex Carter" / 555 phone) used when a workspace had no sender profile → now `400 Create a sender profile before generating brochures`.
- Brochure route checks storage **before** generating the AI pitch (no wasted tokens, Rule 12).
- Fixed while here: raw error text leaked via `details` in `/api/leads/generate` and `/api/ai/pitch-brochure`; scraped business names were inserted into email HTML unescaped (`utils/escape-html.util.ts`).
- `withTenantContext` throws `IntegrationNotConfiguredError('database', 'unavailable')` when it cannot connect (503).
- `_fallbackQueries` renamed `_templateQueries` (deterministic, built from the user's own text — allowed).
- Not changed (noted for a follow-up): `POST /api/campaigns/:id/dispatch` selects every workspace lead instead of the campaign's leads.
