---
trigger: always_on
description: Core platform guidelines, architectural boundaries, and coding standards for Cold Email SaaS.
---

# Lead Generation & Cold Email SaaS Platform Rules

## 1. Architectural Boundaries
- Keep `/frontend` and `/backend` strictly decoupled.
- Frontend must never import or execute backend services, direct DB queries, BullMQ queues, or server-only secrets.
- All client-server communication must flow through `/api/*` endpoints and Socket.io events.

## 2. Multi-Tenancy & Security
- Every SQL table must support multi-tenancy via `workspace_id`.
- Enforce PostgreSQL Row-Level Security (RLS) on all tenant queries using `withTenantContext(workspaceId, ...)`.
- Workspace deduplication: prevent double outreach to the same business within the same workspace.

## 3. Reliability & Testing
- Run test suites and TypeScript compiler checks after every change.
- Never report completion with outstanding compilation errors, failing tests, or unhandled exceptions.

## 4. AI Structured Outputs
- Always use structured JSON outputs when interacting with Google Gemini API.
- Maintain resilient fallbacks so development and offline environments do not crash when external API keys are pending.

## 5. Mandatory Task Logging & Progress Tracking
- Always document each user prompt and task in `TASK_LOG.md`.
- Record timestamp, objective, files changed, verification status, and git commit.
- Keep `PROJECT_DOCUMENTATION.md` updated as features evolve.

