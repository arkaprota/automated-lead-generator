# Implementation Plan: Automated Recurring Search Events & Dedicated Leads

> **Status:** Pending User Approval  
> **Created:** 2026-10-18 08:31 UTC  
> **Feature:** Automated Google Maps Search Events with Daily Recurring Scraping, CRUD Table Dashboard, Dedicated Leads Per Event, and Zero-Duplicate Invariant.

---

## 1. Scope & Functional Objectives
- **Event-Driven Lead Automation**: A user creates an **Event** (e.g., Category: *"Restaurant"*, Location: *"Kolkata"*, Schedule: *"Daily at 09:00"*).
- **CRUD Events Dashboard**: An **Events Page** rendered in a high-density, interactive table format with full CRUD (Create, Read, Update/Edit, Delete, and Start/Stop toggle).
- **Dedicated Leads Per Event**: Every event has its own dedicated Leads view/page (`/events/:id/leads`) showing all leads captured by that specific event.
- **Autonomous Daily Scraping Loop**: A BullMQ cron worker executes Google Maps searches every day at the scheduled time. It keeps running autonomously **until the user clicks the "Stop" button**.
- **Zero-Duplicate Invariant**: Strict database deduplication prevents any duplicate leads from being copied or re-inserted (`UNIQUE(workspace_id, google_place_id)` and `UNIQUE(workspace_id, website)` with `.onConflictDoNothing()`). Only fresh, net-new businesses are added each day.

---

## 2. Files to be Created or Modified

Following **Rule 5 (Single Responsibility Principle per File)**:

### A. Shared Types & Contracts (`packages/shared-types/`)
| File Path | Responsibility |
| :--- | :--- |
| `packages/shared-types/src/enums/event-status.enum.ts` | `EventStatus` enum (`ACTIVE`, `STOPPED`, `COMPLETED`, `FAILED`). |
| `packages/shared-types/src/schemas/search-event.schema.ts` | Zod validation schemas for Event creation, updates, and schedule config. |
| `packages/shared-types/src/interfaces/search-event.interface.ts` | TypeScript interface `ISearchEvent` with lead counter and run metrics. |
| `packages/shared-types/src/enums/index.ts` | Re-export `EventStatus`. |
| `packages/shared-types/src/schemas/index.ts` | Re-export search event schemas. |
| `packages/shared-types/src/interfaces/index.ts` | Re-export search event interfaces. |

### B. Database Schema & Multi-Tenancy (`packages/database/`)
| File Path | Responsibility |
| :--- | :--- |
| `packages/database/src/schema/search-events.schema.ts` | Drizzle ORM schema for `search_events` table with `workspace_id`, category, location, cron schedule, status. |
| `packages/database/src/schema/leads.schema.ts` | Add `eventId` foreign key linking leads to their originating search event. |
| `packages/database/src/schema/relations.ts` | Add relations between `search_events`, `workspaces`, and `leads`. |
| `packages/database/src/schema/index.ts` | Re-export search events schema. |
| `packages/database/src/schema.sql` | SQL migration: `search_events` table + RLS policies + unique deduplication indexes. |

### C. Backend API & Workers (`backend/`)
| File Path | Responsibility |
| :--- | :--- |
| `backend/src/controllers/events.controller.ts` | Controller handlers for CRUD: `createEvent`, `getEvents`, `updateEvent`, `toggleEventStatus`, `deleteEvent`, `getEventLeads`. |
| `backend/src/routes/events.routes.ts` | Express routes mounted at `/api/events`. |
| `backend/src/services/event-scheduler.service.ts` | BullMQ repeatable job manager (adds/removes daily recurring cron jobs per event). |
| `backend/src/workers/event-scrape.worker.ts` | Daily execution worker: scrapes Google Maps ➔ scores with Gemini ➔ persists net-new leads with deduplication. |

### D. Frontend Dashboard (`frontend/`)
| File Path | Responsibility |
| :--- | :--- |
| `frontend/src/app/(dashboard)/events/page.tsx` | Events CRUD Page: data table showing all events with status pills, lead counts, and Start/Stop toggle button. |
| `frontend/src/app/(dashboard)/events/[id]/leads/page.tsx` | Dedicated Leads Page for the selected event with filtering, sorting, and export. |
| `frontend/src/components/features/events/EventCreateDialog.tsx` | Modal form to create a new event (category, location, run time). |
| `frontend/src/services/events.api.ts` | Typed frontend API SDK calling `/api/events`. |

---

## 3. Database Schema & Deduplication Contract

```sql
CREATE TABLE IF NOT EXISTS search_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,        -- e.g. "Restaurant"
    location VARCHAR(255) NOT NULL,        -- e.g. "Kolkata"
    schedule_cron VARCHAR(50) DEFAULT '0 9 * * *', -- Everyday at 9 AM
    status VARCHAR(50) NOT NULL DEFAULT 'active',  -- 'active' (running) or 'stopped'
    total_leads_found INT NOT NULL DEFAULT 0,
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Tenant Policy
ALTER TABLE search_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_search_events ON search_events
    USING (workspace_id = current_setting('app.current_workspace_id', true));

-- Deduplication on Leads (No duplicate leads allowed)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES search_events(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_workspace_place_id ON leads(workspace_id, google_place_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_workspace_website ON leads(workspace_id, website);
```

---

## 4. Step-by-Step Execution Sequence

1. **Phase A (Contracts & Types)**: Create `EventStatus` enum, Zod validation schemas, and domain interfaces in `packages/shared-types`.
2. **Phase B (Database & RLS)**: Create `search-events.schema.ts` in `packages/database`, update `leads.schema.ts` with `eventId`, and add RLS policies.
3. **Phase C (Backend Scheduler & Worker)**:
   - Build `EventSchedulerService` using BullMQ repeatable jobs.
   - Build `event-scrape.worker.ts` that triggers Maps scraper ➔ Gemini scoring ➔ `.onConflictDoNothing()` deduplication.
   - Implement `events.routes.ts` & `events.controller.ts` with full CRUD + `toggle-status` (Start/Stop).
4. **Phase D (Frontend UI)**:
   - Build `/events` page with interactive CRUD data table + Start/Stop action buttons.
   - Build `/events/[id]/leads` dedicated leads view.
   - Build `EventCreateDialog` modal.
5. **Phase E (Testing & Verification)**:
   - Vitest automated tests for Event CRUD and daily recurring scheduling.
   - Run `npm test` and `npm run typecheck` across all 5 workspaces (zero errors).
6. **Phase F (Docs & Git Push)**: Update `.agents/task.md`, `.agents/memory.md`, record in `TASK_LOG.md`, and push to GitHub `origin/main`.

---

## 5. Verification & Testing Strategy
- **Deduplication Test**: Run scraper twice for the exact same query; verify identical leads are skipped and `total_leads_found` reflects only net-new entries.
- **Start/Stop Test**: Toggle status to `stopped`; verify BullMQ removes the repeatable cron job. Toggle back to `active`; verify job is rescheduled.
- **RLS Verification**: Verify Workspace A cannot see or access Workspace B's events or leads.
