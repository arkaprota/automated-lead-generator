# AGENTS.md - LeadPilot AI Platform Rulebook & Guidelines

This document defines the strict architectural boundaries, code standards, and operational guidelines for all AI agents and developers contributing to this repository.

---

## 🏛️ System Architecture & Stack

- **Monorepo Structure**:
  - `/frontend`: Next.js 15 (React 19), Tailwind CSS, Clerk (Authentication), Socket.io-client.
  - `/backend`: Node.js, Express.js, TypeScript, Drizzle ORM, Google Gemini AI (`@google/genai`), BullMQ, Puppeteer.
- **Database**: PostgreSQL (Neon) with active Row-Level Security (RLS) for tenant isolation.
- **Queue**: Upstash Redis with BullMQ (round-robin multi-tenant fairness).
- **Real-Time**: Socket.io for live UI alerts.
- **AI Engine**: Google Gemini API with strict structured JSON outputs.

---

## 📜 Core Platform Rules (Non-Negotiable)

### Rule 1: Strict Frontend / Backend Separation
- **NEVER** put backend code, database connections, Redis/queue clients, scraping utilities, Puppeteer instances, or server secrets (`CLERK_SECRET_KEY`, `GEMINI_API_KEY`, `DATABASE_URL`) inside the `/frontend` directory.
- The frontend must communicate strictly via standard HTTP REST APIs (`/api/*`) or WebSocket events (`socket.io`).

### Rule 2: Mandatory Testing & Zero-Error Policy
- Always run full test suites (`npm --workspace=backend test`) and TypeScript checks (`tsc --noEmit`) before completing any task.
- If any error or lint warning appears, fix it immediately and repeat verification until **zero bugs or errors remain**.

### Rule 3: Multi-Tenant Row-Level Security (RLS) Isolation
- Every tenant table (`workspaces`, `workspace_members`, `sender_profiles`, `campaigns`, `leads`, `email_events`) **MUST** contain a `workspace_id` column.
- Backend database queries must execute through `withTenantContext(workspaceId, (tenantDb) => ...)` to set `SET LOCAL app.current_workspace_id = ...` ensuring PostgreSQL RLS is enforced at the database layer.
- Never write ad-hoc queries that bypass tenant isolation without explicit justification.

### Rule 4: Workspace-Wide Lead Deduplication
- Scraped leads are unique per workspace on `(workspace_id, google_place_id)` and `(workspace_id, website)`.
- Always handle insert conflicts gracefully with `.onConflictDoNothing()`.

### Rule 5: Code Reusability & Folder Structure
- Maintain clean, modular folder structures:
  - Configuration in `src/config/`
  - Database schema & migrations in `src/db/`
  - Middlewares in `src/middleware/`
  - Route handlers in `src/routes/`
  - Business logic & integrations in `src/services/`
  - Domain types in `src/types/`
- Never duplicate logic across routes or services. Use shared service classes (`GeminiService`, `BrochureService`, `QueueService`, `SocketService`).

### Rule 6: Scope Discipline
- Only perform the requested work. Do not make unprompted changes to unrelated features or existing working code.

### Rule 7: Real Data Requirement
- When developing or testing in any financial/stock related projects or workflows, always use real data sources.

### Rule 8: Mandatory Task Logging & Progress Documentation
- Every time a task is given to an AI agent or developer, it **MUST** be recorded in [.agents/TASK_LOG.md](.agents/TASK_LOG.md).
- Each entry must record: Task #, UTC timestamp, User request objective, modified files, test results, and Git commit hash.
- Keep [.agents/PROJECT_DOCUMENTATION.md](.agents/PROJECT_DOCUMENTATION.md) and [.agents/memory.md](.agents/memory.md) updated as platform features evolve.
- The 6 Core Documentation-Driven Development (DDD) files are housed in the [`.agents/`](.agents/) directory:
  - [`.agents/prd.md`](.agents/prd.md)
  - [`.agents/architecture.md`](.agents/architecture.md)
  - [`.agents/rules.md`](.agents/rules.md)
  - [`.agents/design.md`](.agents/design.md)
  - [`.agents/task.md`](.agents/task.md)
  - [`.agents/memory.md`](.agents/memory.md)

---

## 🔄 Core Pipeline Invariants

1. **AI-Scraper-AI Lead Gen Engine**:
   - Demographic intent ➡️ Gemini generates 5 targeted search queries.
   - Raw Google Maps B2B data scraped.
   - Gemini qualifies leads (0-100 score). Null website is flagged as a high-priority "Hot Lead".
   - Persisted to PostgreSQL under `workspace_id`.

2. **Dynamic PDF Brochure Generation**:
   - Gemini generates personalized pitch JSON (pain points, estimated ROI, solutions, CTA).
   - Node merges JSON with sender profile.
   - EJS compiles HTML template ➡️ Puppeteer renders PDF buffer.
   - Public URL stored in campaign lead record.

3. **Email Dispatch & Webhook Loop**:
   - BullMQ worker throttles outbound dispatch at human-like intervals.
   - Inbound email webhook catches replies at `/api/webhooks/email-replies`.
   - Gemini classifies reply intent (`INTERESTED`, `NOT_INTERESTED`, `QUESTION`, `NEUTRAL`).
   - If `INTERESTED`: Backend emits real-time `lead:positive_reply` Socket.io event to room `workspace:<workspaceId>`.
