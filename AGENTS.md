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

## 🚨 MANDATORY AGENT DIRECTIVE: Continuous `.agents/` Synchronization

Every AI agent operating in this repository **MUST** unconditionally follow this workflow on every single user request:
1. **Always Read `.agents/` First**: Before writing or modifying code, the agent MUST review the relevant files in [`.agents/`](.agents/):
   - [`.agents/prd.md`](.agents/prd.md): Product requirements & functional pipeline specifications.
   - [`.agents/architecture.md`](.agents/architecture.md): System topology, tech stack boundaries, and Mermaid data flows.
   - [`.agents/rules.md`](.agents/rules.md): Coding standards, RLS patterns, and non-blocking worker requirements.
   - [`.agents/design.md`](.agents/design.md): UI aesthetic, color tokens, and component guidelines.
2. **Strict Compliance**: All code, migrations, and features MUST strictly comply with the guidelines defined in `.agents/`.
3. **Continuous Updating Mandate**:
   - **Update [`.agents/task.md`](.agents/task.md)**: Check off finished tasks (`- [x]`) sequentially as milestones are completed.
   - **Update [`.agents/memory.md`](.agents/memory.md)**: Log completed actions and update the Feature Registry status (`COMPLETED`, `IN_PROGRESS`, etc.).
   - **Log in [`.agents/TASK_LOG.md`](.agents/TASK_LOG.md)**: Every user instruction/task MUST be recorded with timestamp, objective, files changed, and test results.
4. **Never Ignore or Bypass `.agents/`**: The `.agents/` directory is the single source of truth for the entire platform.

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

### Rule 5: Strict Modular File & Folder Separation for 100% Reusability
- Every codebase (`/frontend`, `/backend`, `/packages/*`), folder, and file MUST follow the **Single Responsibility Principle (SRP)**.
- **Separate file for every separate concept**:
  - Each enum gets its own `.enum.ts` file.
  - Each schema gets its own `.schema.ts` file.
  - Each domain interface gets its own `.interface.ts` file.
  - Each controller, service, repository, route, and worker gets its own dedicated file.
- **NEVER** lump multiple schemas, models, or unrelated utilities into single monolithic "catch-all" files.
- Maximize reusability by extracting isomorphic types, validations, and helpers into dedicated shared packages (`packages/shared-types`, `packages/utils`, `packages/database`).

### Rule 6: Scope Discipline
- Only perform the requested work. Do not make unprompted changes to unrelated features or existing working code.

### Rule 7: Real Data Requirement
- When developing or testing in any financial/stock related projects or workflows, always use real data sources.

### Rule 8: Mandatory Task Logging & Progress Documentation
- Every time a task is given to an AI agent or developer, it **MUST** be recorded in [.agents/TASK_LOG.md](.agents/TASK_LOG.md).
- Each entry must record: Task #, UTC timestamp, User request objective, modified files, test results, and Git commit hash.
- Keep [.agents/PROJECT_DOCUMENTATION.md](.agents/PROJECT_DOCUMENTATION.md) and [.agents/memory.md](.agents/memory.md) updated as platform features evolve.

### Rule 9: Mandatory Implementation Plan & Explicit User Authorization Before Coding
- **ALWAYS** construct and present a clear, structured **Implementation Plan** before adding a new feature or making significant architectural/code modifications.
- The plan must clearly outline:
  1. Scope and functional objectives
  2. Files to be created or modified (with dedicated, single-responsibility file paths)
  3. Database schema or API contract alterations
  4. Step-by-step execution order
  5. Verification and automated testing strategy
- **STRICT BARRIER**: Presenting the plan is a hard checkpoint. The agent **MUST NOT** start writing code or creating files until the user explicitly reviews the plan and instructs to proceed with coding.

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
