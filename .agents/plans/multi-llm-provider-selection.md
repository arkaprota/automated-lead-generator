# Implementation Plan: Multi-LLM Provider Selection (Gemini / Claude / ChatGPT)

> **Status:** PENDING_USER_AUTHORIZATION
> **Created:** 2026-11-16 UTC
> **Feature:** Let each workspace choose which AI provider (Google Gemini, Anthropic Claude, or OpenAI ChatGPT) powers the four AI tasks, instead of being locked to Gemini.

---

## 1. Scope & Functional Objectives

Today the four AI tasks are hard-wired to Gemini inside `backend/src/services/gemini.service.ts`:

| Task | Used by |
| :--- | :--- |
| `expandTargetDemographic` (5 Google Maps queries) | `leads.routes.ts`, `ai.routes.ts`, `event-scheduler.service.ts` |
| `scoreAndQualifyLead` (0–100 score, hot-lead flag) | `leads.routes.ts`, `event-scheduler.service.ts` |
| `generateBrochurePitch` (pitch JSON for the PDF) | `ai.routes.ts` |
| `classifyReplyIntent` (INTERESTED / NOT_INTERESTED / QUESTION / NEUTRAL) | `ai.routes.ts`, `webhooks.routes.ts` |

Objectives:
1. Introduce a provider abstraction so the same four tasks run on **Gemini**, **Claude**, or **OpenAI (ChatGPT)**.
2. Each **workspace** stores its chosen provider (`workspaces.ai_provider`); an env default (`LLM_PROVIDER`) applies when none is set.
3. Frontend gets a provider selector so the user can switch providers from the UI.
4. **Preserve existing behaviour:** prompts, output shapes, and the offline heuristic fallbacks stay identical. If the selected provider has no API key, or its call fails, the existing heuristic fallback runs (exactly as today when `GEMINI_API_KEY` is empty).
5. All provider outputs are validated with Zod before use, so a malformed response from any provider falls back safely instead of corrupting lead data.

Out of scope: per-task provider mixing (e.g. Claude for pitches, Gemini for scoring), automatic cross-provider failover, billing/credit differences per provider.

---

## 2. Files to Create / Modify

### A. New backend files (one concept per file — Rule 5)
| File | Responsibility |
| :--- | :--- |
| `backend/src/enums/llm-provider.enum.ts` | `LlmProvider` enum: `GEMINI = 'gemini'`, `CLAUDE = 'claude'`, `OPENAI = 'openai'` |
| `backend/src/types/llm-client.interface.ts` | `LlmClient` interface: `isConfigured(): boolean`, `generateJson<T>(task: LlmJsonTask<T>): Promise<T>` |
| `backend/src/types/llm-json-task.interface.ts` | `LlmJsonTask<T>`: `{ name, prompt, zodSchema, effort? }` |
| `backend/src/config/anthropic.ts` | Lazy singleton `Anthropic` client (`@anthropic-ai/sdk`) |
| `backend/src/config/openai.ts` | Lazy singleton `OpenAI` client (`openai`) |
| `backend/src/services/llm/gemini.client.ts` | Gemini adapter — moves the existing `generateContent` + `responseMimeType: 'application/json'` call here |
| `backend/src/services/llm/claude.client.ts` | Claude adapter — Messages API with structured outputs (`output_config.format` JSON schema), model `claude-opus-5-5` by default, server-side refusal fallbacks enabled |
| `backend/src/services/llm/openai.client.ts` | OpenAI adapter — JSON-schema structured output |
| `backend/src/services/llm/llm-client.factory.ts` | `getLlmClient(provider)` → returns the matching adapter |
| `backend/src/services/llm/workspace-ai-provider.service.ts` | Reads/updates `workspaces.ai_provider` through `withTenantContext` |
| `backend/src/schemas/ai/query-expansion.schema.ts` | Zod schema for query expansion output |
| `backend/src/schemas/ai/lead-scoring.schema.ts` | Zod schema for lead scoring output |
| `backend/src/schemas/ai/brochure-pitch.schema.ts` | Zod schema for pitch output |
| `backend/src/schemas/ai/reply-classification.schema.ts` | Zod schema for reply classification output |
| `backend/src/schemas/ai-provider-settings.schema.ts` | Zod body validator for `PATCH /api/workspace/ai-provider` |
| `backend/src/routes/workspace-settings.routes.ts` | `GET` / `PATCH /api/workspace/ai-provider` |
| `backend/src/services/__tests__/llm-client.factory.test.ts` | Unit tests (see §5) |

### B. Backend files modified (surgical)
| File | Change |
| :--- | :--- |
| `backend/src/services/gemini.service.ts` → **renamed** `ai.service.ts` (`AiService`) | Same 4 methods, same prompts, same heuristic fallbacks. Each method takes an optional `provider` arg; replaces direct Gemini calls with `getLlmClient(provider).generateJson(...)`. The `!env.GEMINI_API_KEY` checks become `!client.isConfigured()`. |
| `backend/src/routes/leads.routes.ts`, `ai.routes.ts`, `webhooks.routes.ts`, `services/event-scheduler.service.ts` | Import swap `GeminiService` → `AiService`; resolve the workspace's provider and pass it in. |
| `backend/src/routes/index.ts` | Mount `workspace-settings.routes.ts` behind `tenantMiddleware`. |
| `backend/src/config/env.ts` | Add `LLM_PROVIDER` (enum, default `gemini`), `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_MODEL` (default `gemini-2.5-flash`), `CLAUDE_MODEL` (default `claude-opus-5-5`), `OPENAI_MODEL`. |
| `backend/src/enums/index.ts`, `types/index.ts`, `schemas/index.ts` | Barrel exports for new files. |
| `backend/.env.example` | Document new variables. |
| `backend/package.json` | Add `@anthropic-ai/sdk` and `openai`. |

### C. Frontend files
| File | Change |
| :--- | :--- |
| `frontend/src/types/llm-provider.enum.ts` | New — mirrors backend enum values (no cross-import, Rule 1) |
| `frontend/src/lib/ai-provider.api.ts` | New — `getAiProvider()` / `setAiProvider()` REST calls |
| `frontend/src/components/navigation/AiProviderSelector.tsx` | New — compact dropdown (Gemini / Claude / ChatGPT), styled per `design.md` |
| `frontend/src/components/navigation/Navbar.tsx` | Mount `<AiProviderSelector />` in the right-hand action area (one-line addition) |
| `frontend/src/types/index.ts` | Barrel export |

No API keys ever reach the frontend — the UI only sends the provider name.

---

## 3. Database & API Contract Changes

**DB (`workspaces` table — already RLS-protected):**
```sql
ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS ai_provider VARCHAR(20) NOT NULL DEFAULT 'gemini'
  CHECK (ai_provider IN ('gemini', 'claude', 'openai'));
```
Mirrored in `backend/src/db/schema.ts` (`aiProvider` column) and `backend/src/db/schema.sql`.

**API:**
| Method | Path | Body / Response |
| :--- | :--- | :--- |
| `GET` | `/api/workspace/ai-provider` | `{ success, data: { provider, availableProviders: [{ id, label, configured }] } }` — `configured` tells the UI which providers have server keys |
| `PATCH` | `/api/workspace/ai-provider` | Body `{ provider: 'gemini' \| 'claude' \| 'openai' }` → `{ success, data: { provider } }` |

Existing endpoints keep their request/response shapes unchanged.

---

## 4. Step-by-Step Execution Order

1. Install `@anthropic-ai/sdk` and `openai` in `/backend`; extend `env.ts` + `.env.example`.
2. Add enum, interfaces, and Zod output schemas.
3. Build the three adapters + factory (Gemini adapter first, so behaviour is verifiably unchanged).
4. Rename `gemini.service.ts` → `ai.service.ts`, route all calls through the factory; update the 4 callers.
5. Add `ai_provider` column (schema.ts + schema.sql) and `workspace-ai-provider.service.ts`.
6. Add `workspace-settings.routes.ts` and mount it.
7. Frontend: enum, API client, `AiProviderSelector`, Navbar mount.
8. Verification loop (§5), then documentation sync and push (Rule 10).

---

## 5. Verification & Testing Strategy

- **New unit tests** (`llm-client.factory.test.ts`, SDKs mocked — no paid calls):
  - factory returns the right adapter for each enum value;
  - `isConfigured()` is false without a key → `AiService` returns the existing heuristic output;
  - an adapter returning malformed JSON / schema-invalid output → heuristic fallback, no throw;
  - provider resolution order: workspace setting → `LLM_PROVIDER` env → `gemini`.
- **API tests:** `GET`/`PATCH /api/workspace/ai-provider` incl. 400 on invalid provider.
- **Regression:** existing `api.test.ts` + `events.test.ts` (12 tests) must still pass unchanged.
- `npm --prefix backend run typecheck`, `npm --prefix backend test`, `npm --prefix backend run build`.
- `npm --prefix frontend run typecheck`, `npm --prefix frontend run build`.
- Optional manual smoke test with real keys (only with your go-ahead — it costs API credits).

---

## 6. Decisions Needing Your Confirmation

1. ✅ **RESOLVED (user, 2026-11-16):** The user selects the provider from the UI and can change it at any time. → Per-workspace setting + Navbar dropdown; `LLM_PROVIDER` env is only the default for workspaces that never chose.
   - A change takes effect on the **next** AI call. Scheduled search events resolve the provider when each job **runs**, not when it was scheduled, so switching applies to future runs too.
   - Providers whose API key is missing on the server are shown disabled in the dropdown ("not configured").
2. **Default Claude model** — `claude-opus-5-5` (most capable; ~$4 / $20 per 1M tokens). Lead scoring runs once per scraped lead, so this can add up; the model is overridable via `CLAUDE_MODEL` (e.g. `claude-haiku-5-5` for low cost).
3. **OpenAI default model** — set via `OPENAI_MODEL`; exact default confirmed at coding time.
4. **Rename `GeminiService` → `AiService`** — recommended, since the name would otherwise be misleading. Touches only import lines in 4 files.

---

## 6b. Token-Efficiency Measures (AGENTS.md Rule 12, added 2026-11-16)

Built into this feature for all three providers:

| Measure | Where | Saving |
| :--- | :--- | :--- |
| Dedupe against existing workspace leads **before** scoring | `event-scheduler.service.ts`, `leads.routes.ts` | Daily events re-scrape the same places; today every duplicate is scored and then discarded on insert |
| Skip AI for no-website leads (already deterministic "hot" rule) | `ai.service.ts` | One call per hot lead |
| Batch scoring: new `scoreAndQualifyLeads(leads[])`, up to 10 leads per request | `ai.service.ts` + callers | Shared instructions sent once per batch, not per lead |
| Remove the inline JSON-schema text from prompts (schema is enforced natively by each adapter) | `ai.service.ts` prompts | Fewer input tokens per call; output shapes unchanged |
| Per-task max output tokens: queries 300, scoring 200/lead, pitch 800, classification 150 | `LlmJsonTask.maxOutputTokens` | No runaway outputs |
| Lowest reasoning effort (Claude `effort: "low"`, OpenAI low reasoning effort, Gemini minimal thinking) | each adapter | Fewer thinking tokens |
| Strip quoted history/signatures from reply text before classification | new `backend/src/utils/clean-reply-text.util.ts` | Long threads shrink to the new message |
| Redis cache (24h TTL) for query expansion keyed by workspace + provider + demographic | new `backend/src/services/llm/llm-cache.service.ts` | Repeat event runs cost zero tokens |
| Max one retry, then heuristic fallback | `llm-client.factory.ts` | No retry storms |
| Token usage log per call (provider, task, workspace, in/out tokens) | each adapter | Spend visibility |

Added tests: dedupe skips AI for existing leads; batch scoring maps results back to the right leads; reply cleaner strips quoted text; cache hit avoids a provider call.

---

## 7. Documentation Sync (on completion)
- `.agents/architecture.md`, `.agents/prd.md`, `AGENTS.md` "AI Engine" line: Gemini-only → multi-provider.
- `.agents/task.md`, `.agents/memory.md` (Feature Registry: "Multi-LLM Provider Selection"), `.agents/TASK_LOG.md` (Task #025/026).
