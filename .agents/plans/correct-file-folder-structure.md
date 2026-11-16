# Implementation Plan: Correct File and Folder Structure (SRP & Boundary Clean-up)

> **Status:** COMPLETED  
> **Created:** 2026-10-21 10:30 UTC  
> **Feature:** Modular Single Responsibility Principle (SRP) file separation for types, kebab-case naming consistency, frontend type deduplication, and removal of backend secrets from frontend environment template.

---

## 1. Scope & Functional Objectives

1. **Modular Type Separation in `backend/` (Rule 5 SRP)**:
   - Split the monolithic `backend/src/types/index.ts` into individual, dedicated `.interface.ts` files:
     - `authenticated-request.interface.ts`
     - `query-expansion-response.interface.ts`
     - `lead-scoring-response.interface.ts`
     - `brochure-pitch-response.interface.ts`
     - `reply-classification-response.interface.ts`
     - `raw-scraped-lead.interface.ts`
     - `socket-events.interface.ts`
   - Remove duplicate `ReplyIntent` type declaration in favor of `backend/src/enums/reply-intent.enum.ts`.
   - Keep `backend/src/types/index.ts` purely as a barrel export for all interfaces.

2. **File Naming Consistency in `backend/`**:
   - Rename `backend/src/services/leadScraper.service.ts` to `backend/src/services/lead-scraper.service.ts` to strictly match the kebab-case naming standard of all other services.
   - Update import paths in `event-scheduler.service.ts` and `leads.routes.ts`.

3. **Modular Type Separation & Deduplication in `frontend/` (Rule 5 & 6)**:
   - Split `frontend/src/types/events.interface.ts` into dedicated files:
     - `frontend/src/types/search-event.interface.ts`
     - `frontend/src/types/create-event-payload.interface.ts`
     - `frontend/src/types/event-lead.interface.ts`
   - Update `frontend/src/types/index.ts` to re-export all domain types.
   - Update `frontend/src/lib/events.api.ts` to import these types from `@/types` instead of re-declaring duplicates.

4. **Architectural Boundary Enforcement (Rule 1)**:
   - Remove `CLERK_SECRET_KEY` from `frontend/.env.example` so that server secrets never appear in client-side configurations.

---

## 2. Files to be Created, Modified, or Renamed

### A. New Interface Files in `backend/src/types/`
| File Path | Interface |
| :--- | :--- |
| `backend/src/types/authenticated-request.interface.ts` | `AuthenticatedRequest` |
| `backend/src/types/query-expansion-response.interface.ts` | `QueryExpansionResponse` |
| `backend/src/types/lead-scoring-response.interface.ts` | `LeadScoringResponse` |
| `backend/src/types/brochure-pitch-response.interface.ts` | `BrochurePitchResponse` |
| `backend/src/types/reply-classification-response.interface.ts` | `ReplyClassificationResponse` |
| `backend/src/types/raw-scraped-lead.interface.ts` | `RawScrapedLead` |
| `backend/src/types/socket-events.interface.ts` | `SocketEvents` |

### B. New Interface Files in `frontend/src/types/`
| File Path | Interface |
| :--- | :--- |
| `frontend/src/types/search-event.interface.ts` | `SearchEventItem` |
| `frontend/src/types/create-event-payload.interface.ts` | `CreateEventPayload` |
| `frontend/src/types/event-lead.interface.ts` | `EventLeadItem` |

### C. Files to be Renamed / Replaced
| Old Path | New Path |
| :--- | :--- |
| `backend/src/services/leadScraper.service.ts` | `backend/src/services/lead-scraper.service.ts` |
| `frontend/src/types/events.interface.ts` | Split into individual interfaces above, then deleted. |

### D. Files to be Modified
| File Path | Planned Changes |
| :--- | :--- |
| `backend/src/types/index.ts` | Clean barrel export of all individual interface files. |
| `backend/src/services/event-scheduler.service.ts` | Update import to `./lead-scraper.service.js`. |
| `backend/src/routes/leads.routes.ts` | Update import to `../services/lead-scraper.service.js`. |
| `frontend/src/types/index.ts` | Re-export all individual interface files. |
| `frontend/src/lib/events.api.ts` | Import types from `@/types` instead of declaring duplicate interfaces. |
| `frontend/.env.example` | Remove `CLERK_SECRET_KEY` line. |

---

## 3. Step-by-Step Execution Order

1. **Step 1 (Backend Types Refactoring)**:
   - Create single-responsibility `.interface.ts` files in `backend/src/types/`.
   - Update `backend/src/types/index.ts` as a clean barrel export.
2. **Step 2 (Backend Service Kebab-Case Rename)**:
   - Rename `leadScraper.service.ts` to `lead-scraper.service.ts`.
   - Update imports in `event-scheduler.service.ts` and `leads.routes.ts`.
3. **Step 3 (Frontend Types Refactoring & Deduplication)**:
   - Create dedicated `.interface.ts` files in `frontend/src/types/`.
   - Update `frontend/src/types/index.ts`.
   - Update `frontend/src/lib/events.api.ts` to import types from `@/types`.
   - Remove obsolete `frontend/src/types/events.interface.ts`.
4. **Step 4 (Frontend Secret Clean-up)**:
   - Remove `CLERK_SECRET_KEY` from `frontend/.env.example`.
5. **Step 5 (Verification & Testing)**:
   - Run `npm --prefix backend run typecheck` and `npm --prefix backend run build`.
   - Run `npm --prefix backend test` (12/12 Vitest tests).
   - Run `npm --prefix frontend run typecheck` and `npm --prefix frontend run build`.
6. **Step 6 (Documentation & Stage 5 Push)**:
   - Update `.agents/plans/correct-file-folder-structure.md` to `COMPLETED`.
   - Update `.agents/task.md`, `.agents/memory.md`, and record Task #025 in `.agents/TASK_LOG.md`.
   - Automatically stage and push commit to `origin/main`.
