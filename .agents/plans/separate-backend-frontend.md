# Implementation Plan: Complete Separation of Backend and Frontend Codebases

> **Status:** COMPLETED (Verified & Tested)  
> **Created:** 2026-10-21 09:42 UTC  
> **Started:** 2026-10-21 09:45 UTC  
> **Completed:** 2026-10-21 09:53 UTC  
> **Feature:** Complete separation of `/backend` and `/frontend`, removal of root `packages/` and root `node_modules/`, migration of needed schemas/types into their respective codebases, and database pool error handling fix.

---

## 1. Scope & Functional Objectives

The goal is to eliminate root-level workspace coupling and establish two completely independent, self-contained codebases:
1. **Independent `/backend`**:
   - All server logic, database schemas, enums, validation schemas, and utilities live entirely inside `/backend`.
   - Migrate required enums (`event-status`, `lead-status`, `reply-intent`, `campaign-status`), Zod schemas (`search-event.schema`, `lead.schema`, `campaign.schema`), and interfaces from `packages/shared-types` directly into modular, single-responsibility files inside `backend/src/schemas/`, `backend/src/enums/`, and `backend/src/types/`.
   - Update `backend/src/routes/events.routes.ts` and all other files to import locally instead of importing `@leadpilot/shared-types`.
   - Remove `@leadpilot/*` path mappings from `backend/tsconfig.json`.
   - Fix PostgreSQL pool error resilience in `backend/src/config/db.ts` (`pool.on('error', ...)` and `env.DATABASE_URL?.includes('neon.tech')`) to prevent unhandled node crashes when PostgreSQL runs offline or in development.
2. **Independent `/frontend`**:
   - All client logic, UI components, Next.js routes, and types live entirely inside `/frontend`.
   - Ensure all frontend types reside in `frontend/src/types/` without any dependency on external root packages.
   - Remove `@leadpilot/*` path mappings from `frontend/tsconfig.json`.
3. **Elimination of Root `packages/` and Root `node_modules/`**:
   - Delete `packages/` directory (`packages/shared-types`, `packages/database`, `packages/utils`).
   - Delete root `node_modules/` directory.
   - Update root `package.json` to remove `"workspaces"` so npm never installs or creates symlinks at the root level.
   - Update root scripts to delegate directly using `--prefix backend` and `--prefix frontend` (e.g. `npm --prefix backend run dev`, `npm --prefix frontend run dev`).
   - Clean up `tsconfig.base.json` and `package-lock.json` at root.

---

## 2. Files to be Created, Modified, or Deleted

Following **Rule 5 (Single Responsibility Principle)** and **Rule 6 (Surgical Code Modifications)**:

### A. Files to be Created in `backend/`
| File Path | Responsibility |
| :--- | :--- |
| `backend/src/enums/event-status.enum.ts` | Enum for search event lifecycle states (`active`, `stopped`, `completed`, `failed`). |
| `backend/src/enums/lead-status.enum.ts` | Enum for lead status states. |
| `backend/src/enums/reply-intent.enum.ts` | Enum for email reply classification. |
| `backend/src/enums/campaign-status.enum.ts` | Enum for campaign status. |
| `backend/src/enums/index.ts` | Re-export all enums. |
| `backend/src/schemas/search-event.schema.ts` | Zod validation schemas (`CreateSearchEventSchema`, `UpdateSearchEventSchema`). |
| `backend/src/schemas/lead.schema.ts` | Zod validation schemas for lead qualification. |
| `backend/src/schemas/index.ts` | Re-export all Zod schemas. |
| `backend/src/types/search-event.interface.ts` | TypeScript domain interfaces for search events. |

### B. Files to be Created in `frontend/`
| File Path | Responsibility |
| :--- | :--- |
| `frontend/src/types/event-status.enum.ts` | Search event status enum for frontend components. |
| `frontend/src/types/events.interface.ts` | Dedicated frontend interface for events & event leads. |

### C. Files to be Modified
| File Path | Planned Changes |
| :--- | :--- |
| `backend/src/config/db.ts` | Add `pool.on('error', ...)` handler and optional chaining to prevent unhandled node crash. |
| `backend/src/routes/events.routes.ts` | Update import from `@leadpilot/shared-types` to local `../schemas/search-event.schema.js`. |
| `backend/tsconfig.json` | Remove `paths` pointing to `../packages/*`. |
| `frontend/tsconfig.json` | Remove `paths` pointing to `../packages/*`. |
| `package.json` | Remove `"workspaces"` field; update scripts to use `--prefix backend` and `--prefix frontend`. |
| `DEVELOPER_GUIDE.md` | Update setup instructions to reflect separate backend and frontend projects. |

### D. Files and Directories to be Deleted
| Path | Reason |
| :--- | :--- |
| `packages/` | Entire root packages folder removed (all needed code relocated into backend/frontend). |
| `node_modules/` | Root-level node_modules removed (backend and frontend maintain their own independent `node_modules`). |
| `tsconfig.base.json` | Remove root base tsconfig; each project has self-contained tsconfig. |

---

## 3. Database Schema & API Contract Alterations
- **Zero Schema Changes**: Database tables and schemas remain 100% intact.
- **Zero API Contract Alterations**: All REST endpoints (`/api/events`, `/api/health`, etc.) and Socket.io events remain identical.

---

## 4. Step-by-Step Execution Order

1. **Step 1 (Migrate Types & Schemas into `backend/`)**:
   - [x] Create single-responsibility files for enums, schemas, and interfaces in `backend/src/enums/`, `backend/src/schemas/`, and `backend/src/types/`.
   - [x] Update `backend/src/routes/events.routes.ts` to import locally.
   - [x] Update `backend/tsconfig.json` to remove external path mappings.
2. **Step 2 (Fix DB Error Handling in `backend/src/config/db.ts`)**:
   - [x] Add safe optional chaining for `env.DATABASE_URL?.includes('neon.tech')`.
   - [x] Attach `pool.on('error', (err) => console.warn('[PostgreSQL Pool Warning]', err.message))` to handle connection dropouts without crashing the process.
3. **Step 3 (Update `frontend/`)**:
   - [x] Add frontend types in `frontend/src/types/`.
   - [x] Update `frontend/tsconfig.json` to remove external path mappings.
4. **Step 4 (Delete Root `packages/` and Root `node_modules/`)**:
   - [x] Remove `packages/` directory.
   - [x] Remove root `node_modules/`.
   - [x] Update root `package.json` (remove `"workspaces"` array, use `--prefix`).
5. **Step 5 (Verification & Testing)**:
   - [x] Run `npm run build` and `npm run test` in `backend` (`tsc` and 12/12 Vitest tests passing).
   - [x] Run `npm run build` in `frontend` (Next.js 15 build with 6/6 static & dynamic routes).
   - [x] Verify frontend and backend communicate via pure HTTP/WebSocket.
6. **Step 6 (Documentation & Stage 5 Push)**:
   - [x] Update `.agents/task.md`, `.agents/memory.md`, and record Task #022 in `.agents/TASK_LOG.md`.
   - [x] Stage, commit, and push commit to `origin/main` (commit `deb10d0`).
