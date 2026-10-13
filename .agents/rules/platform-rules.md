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
- Always document each user prompt and task in `.agents/TASK_LOG.md`.
- Record timestamp, objective, files changed, verification status, and git commit.
- Keep `.agents/PROJECT_DOCUMENTATION.md` updated as features evolve.

## 6. Continuous `.agents/` Workflow & Memory Updates
- Every AI agent MUST inspect the `.agents/` directory before writing code.
- Continuously update `.agents/task.md` (check off completed items) and `.agents/memory.md` (update current state and feature registry) on every completed milestone.

## 7. Mandatory Implementation Plan & User Authorization
- Always provide a clear, structured Implementation Plan before introducing any new feature or executing significant architectural changes.
- Detail the scope, affected files, schema/contract alterations, step-by-step execution path, and testing/validation strategy.
- **NEVER begin coding or creating files until the user explicitly reviews and authorizes execution.**

## 8. Strict Modular File & Folder Separation for Reusability
- Every codebase (`/frontend`, `/backend`, `/packages/*`), folder, and file must strictly follow the Single Responsibility Principle.
- Separate files for every separate concept: dedicated files for each enum, schema, interface, controller, service, repository, and component.
- Shared packages (`packages/shared-types`, `packages/utils`, `packages/database`) isolate domain logic for maximum reusability. No monolithic multi-purpose files.

