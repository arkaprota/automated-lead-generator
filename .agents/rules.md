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
- **Mandatory Implementation Plan:** Always construct and present a structured **Implementation Plan** before adding a new feature or making any major architectural/code change. The plan must detail the scope, affected files, schema/contract changes, and testing strategy.

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
