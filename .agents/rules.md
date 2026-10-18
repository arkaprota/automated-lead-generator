# Development Rules & Coding Standards

## Document Information
- **Standard Name:** LeadPilot AI Engineering & Architecture Rulebook
- **Version:** 1.0.0
- **Status:** Mandatory / Non-Negotiable
- **Date:** October 13, 2026

---

## 1. General Principles

### 1.1 Documentation-Driven Development (DDD)
- **Code Follows Documentation:** Never write code before checking and aligning with `prd.md`, `architecture.md`, `rules.md`, and `design.md`.
- **State Updating Mandate:** After completing any task or milestone, the AI engineer **MUST** update `task.md` (check off items) and `memory.md` (update current status and feature registry).
- **Task Logging:** Document every assigned task in `TASK_LOG.md` with UTC timestamp, objective, modified files, test results, and commit hash.
- **Mandatory Implementation Plan & User Authorization:** Always construct and present a structured **Implementation Plan** before adding a new feature or making any major architectural/code change. **The plan must be saved in `.agents/plans/<feature-name>.md` and edited as requirements evolve.** The plan must detail the scope, affected files (with dedicated, modular paths), schema/contract changes, and testing strategy. **Never begin coding or creating files until the user explicitly reviews and approves the plan.**
- **Strict Single Responsibility File & Folder Separation:** Every separate concept must live in its own dedicated file. Each enum has its own file, each schema has its own file, each interface has its own file, each controller/service/repository has its own file. Monolithic multi-purpose files are strictly forbidden to ensure clean reusability.

### 1.2 Strict Multi-Tenant Isolation
- Every relational table storing tenant data **MUST** contain a `workspace_id` column.
- Every database interaction **MUST** execute within an active Row-Level Security (RLS) context using `withTenantContext(workspaceId, (tenantDb) => ...)`:
  ```typescript
  // REQUIRED Pattern:
  await withTenantContext(workspaceId, async (tenantDb) => {
    return tenantDb.select().from(leads).where(eq(leads.workspaceId, workspaceId));
  });
  ```
- Ad-hoc queries bypassing tenant context without authorization are strictly prohibited.

### 1.3 Idempotency & Error Recovery
- Inbound webhooks (`/api/webhooks/*`) **MUST** be idempotent. Use `message_id` or external provider event IDs to avoid duplicate processing.
- Workers in BullMQ **MUST** implement exponential backoff retry policies and dead-letter queue (DLQ) logging.

### 1.4 Surgical Scope Discipline & Minimal Blast Radius
- **Change Only Required Code:** When modifying code, make precise, targeted edits only to the specific lines and functions necessary. Never rewrite entire files or alter adjacent unrelated blocks.
- **Do Not Touch Unrelated Things:** Never touch, refactor, reformat, or alter existing working code, configurations, packages, styles, or utilities outside the explicit scope of the user request.
- **Preserve Existing State:** Maintain all comments, docstrings, variable naming patterns, and established architecture unless explicitly directed to change them.

### 1.5 Standard 5-Stage Engineering Lifecycle & Automatic Git Push
Every feature, fix, or code modification MUST follow this sequential 5-stage lifecycle:
1. **Coding:** Write modular, single-responsibility code strictly adhering to architectural boundaries. Surgical modifications only.
2. **Debugging:** Actively debug and resolve any compilation, type check, or runtime errors before considering work complete.
3. **Automated Testing Loop:** Run full test suites (`npm test`) and TypeScript checks (`tsc --noEmit`). If any error or bug appears, fix it immediately and re-run testing in a loop until **zero bugs and zero errors remain**.
4. **Documentation Sync:** Update `.agents/task.md` (check off tasks), `.agents/memory.md` (state and features), and record the task in `.agents/TASK_LOG.md`.
5. **Automatic Git Push:** Automatically stage changes (`git add .`), commit with descriptive semantic messages, and **push to GitHub (`origin/main`)** upon verification. Never leave verified work uncommitted or unpushed.

### 1.6 Universal Applicability & Repository-Wide Governance
- These rules apply unconditionally to **EVERY AI agent, human developer, and future collaborator** working on this repository.
- No developer or agent is permitted to bypass these rules under any circumstance.

---

## 2. Technology & Coding Standards

### 2.1 TypeScript Strict Mode
- Both `/apps/web` (frontend) and `/apps/api` (backend) must operate with `"strict": true` in `tsconfig.json`.
- Disallow explicit `any` types. Use proper generics, Discriminated Unions, and domain interfaces.

### 2.2 Zod Validation Everywhere
- **Incoming API Requests:** Every Express route must validate `req.body`, `req.query`, and `req.params` with Zod schemas via middleware.
- **Environment Variables:** `src/config/env.ts` must validate process environment variables on startup and fail fast if required secrets are absent.
- **AI Structured Outputs:** Every call to Google Gemini requesting JSON must enforce a Zod schema to guarantee parsing integrity.

### 2.3 Express Architecture Pattern
- Follow the **Controller-Service-Repository** pattern:
  - `routes/`: Routing definition and middleware mounting.
  - `controllers/` / Route Handlers: Request parsing, calling services, returning standardized HTTP responses.
  - `services/`: Business logic, AI prompt compilation, queue dispatch, socket notifications.
  - `db/` / Data Access: Type-safe Drizzle ORM models and queries.

---

## 3. Project Structure & Boundary Rules

### 3.1 Strict Frontend / Backend Separation
- **NEVER** import or execute backend services, database connections (`pg`, `neon`, `drizzle`), Redis/BullMQ queues, scraping scripts, Puppeteer, or server secrets (`CLERK_SECRET_KEY`, `GEMINI_API_KEY`, `DATABASE_URL`) inside the `/apps/web` (frontend) directory.
- The frontend interacts with backend resources strictly via standard HTTP REST APIs (`/api/*`) and WebSocket events (`socket.io`).

### 3.2 Non-Blocking Event Loop Standard
- **NEVER** run heavy or long-running synchronous operations on the main Express HTTP thread.
- The following tasks **MUST** be offloaded to BullMQ background workers:
  1. Google Maps scraping pipelines.
  2. Puppeteer HTML-to-PDF rendering and cloud uploads.
  3. Bulk email dispatch and delivery throttling.

### 3.3 Zero-Bug & Mandatory Testing Policy
- Run test suites (`npm test`) and TypeScript compilation checks (`tsc --noEmit`) before completing any task.
- If any test fails or compiler error arises, resolve it immediately before reporting completion.
