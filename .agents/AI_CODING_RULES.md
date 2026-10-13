# AI_CODING_RULES.md - AI Coding Rulebook & Operational Standard

This document is the **authoritative rulebook for AI coding assistants** working on this codebase. Every AI model, subagent, and automated process MUST adhere strictly to the rules below without exception.

---

## 🛑 Rule 1: Strict Architectural Separation (Frontend vs. Backend)

- **NEVER** place backend code, database drivers (`pg`, `neon`, `drizzle`), Redis/BullMQ clients, scraper utilities, Puppeteer instances, or server secrets (`CLERK_SECRET_KEY`, `GEMINI_API_KEY`, `DATABASE_URL`) inside the `/frontend` directory.
- The frontend must remain a pure client-side / Next.js presentation layer communicating exclusively via HTTP REST endpoints (`/api/*`) and standard WebSocket events (`socket.io`).
- All business logic, AI orchestration, PDF synthesis, and database operations belong in `/backend`.

---

## 🧪 Rule 2: Mandatory Testing & Zero-Bug Policy

- **NEVER** declare a task complete if there are outstanding compilation errors, failing tests, or unhandled exceptions.
- Before delivering output to the user:
  1. Run the test suite: `npm --workspace=backend test`
  2. Run TypeScript checks on backend: `npm --workspace=backend run build` or `tsc --noEmit`
  3. Run TypeScript checks on frontend: `npm --workspace=frontend run build` or `tsc --noEmit`
- If ANY error or warning appears:
  - Immediately inspect the stack trace and root cause.
  - Fix the issue in the code.
  - Re-run the verification command.
  - Repeat this loop until **zero errors or bugs remain**.

---

## 🔒 Rule 3: Multi-Tenant Row-Level Security (RLS) Isolation

- Every table containing tenant data (`workspaces`, `workspace_members`, `sender_profiles`, `campaigns`, `leads`, `email_events`) **MUST** include a `workspace_id` column.
- Backend database queries MUST execute within tenant isolation via `withTenantContext(workspaceId, (tenantDb) => ...)`:
  ```typescript
  await withTenantContext(workspaceId, async (tenantDb) => {
    // Queries here execute with 'SET LOCAL app.current_workspace_id = workspaceId'
    return tenantDb.select().from(leads).where(eq(leads.workspaceId, workspaceId));
  });
  ```
- Never execute raw or ad-hoc queries that bypass tenant context without explicit architectural necessity.

---

## 🛡️ Rule 4: Workspace-Wide Lead Deduplication

- In PostgreSQL, leads are unique per workspace based on:
  - `(workspace_id, google_place_id)`
  - `(workspace_id, website)`
  - `(workspace_id, email)`
- Always insert leads using `.onConflictDoNothing()` or explicit conflict resolution to prevent duplicate outreach errors.

---

## 📂 Rule 5: Folder & File Structure Standard

The AI must maintain clean, modular folder conventions:
- **Backend**:
  - `src/config/`: Configuration & client singletons (`env.ts`, `db.ts`, `redis.ts`, `gemini.ts`).
  - `src/db/`: SQL migrations & Drizzle ORM schema definitions (`schema.sql`, `schema.ts`).
  - `src/middleware/`: Express middlewares (`tenant.middleware.ts`, `validator.middleware.ts`, `error.middleware.ts`).
  - `src/routes/`: Route controllers grouped by domain (`leads`, `ai`, `campaigns`, `webhooks`, `health`).
  - `src/services/`: Reusable business logic classes (`gemini.service.ts`, `brochure.service.ts`, `queue.service.ts`, `socket.service.ts`).
  - `src/types/`: Domain TypeScript interfaces and types.
- **Frontend**:
  - `src/app/`: Next.js App Router pages and layouts.
  - `src/components/`: Reusable React UI components and widgets.
  - `src/lib/`: Client-side utilities (`api.ts`, `socket.ts`).

---

## ♻️ Rule 6: Code Reusability & DRY Standard

- **Never duplicate logic** across routes, components, or services.
- If a helper or pipeline step is needed in more than one place, extract it into a shared service or utility function.
- Maintain consistent typing using TypeScript interfaces instead of using `any`.

---

## 🎯 Rule 7: Strict Scope Discipline

- Perform **ONLY** the requested work.
- Do not make unprompted changes to unrelated features, existing working code, or external configurations.
- Preserve existing comments and docstrings.

---

## 📊 Rule 8: Real Data Requirement

- When developing, testing, or mocking workflows in financial/stock-related systems, always use real data sources.

---

## 🤖 Rule 9: Google Gemini AI Structured Outputs

- Always enforce strict JSON schemas when prompting Gemini (`responseMimeType: 'application/json'`).
- Always implement resilient fallback handling so that offline test environments or delayed API keys do not cause unhandled crashes.

---

## 📝 Rule 10: Mandatory Task Logging & Progress Audit Trail

- **Document every assigned task**: For every prompt/instruction received from the user, the AI must log an entry in [`TASK_LOG.md`](TASK_LOG.md).
- Each entry must include:
  1. Task Number (sequential e.g. #001, #002...)
  2. Timestamp (UTC)
  3. User request objective
  4. Actions taken and files created/modified
  5. Test results and verification summary
  6. Git commit hash
- Keep [`PROJECT_DOCUMENTATION.md`](PROJECT_DOCUMENTATION.md) updated with platform progress and milestone completions.

---

## 🔄 Rule 11: AI Verification Checklist

Before reporting completion to the user, the AI must verify:
- [ ] Backend code is isolated from frontend?
- [ ] Multi-tenant RLS context is respected?
- [ ] Full test suite passes (`npm test`)?
- [ ] TypeScript compiles cleanly on both workspaces (`tsc --noEmit`)?
- [ ] Only the requested files were modified?
- [ ] Task entry is recorded in [`TASK_LOG.md`](TASK_LOG.md)?
- [ ] Documentation and git status are updated and committed?
