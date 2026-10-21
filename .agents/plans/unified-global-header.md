# Implementation Plan: Unified Global Header for All Pages

> **Status:** COMPLETED (Verified & Tested)  
> **Created:** 2026-10-21 08:55 UTC  
> **Started:** 2026-10-21 09:16 UTC  
> **Completed:** 2026-10-21 09:22 UTC  
> **Feature:** Unified, responsive global header across all pages in LeadPilot AI.

---

## 1. Scope & Functional Objectives
- **Global Header Mount**: Mount a unified, responsive header component directly inside `frontend/src/app/layout.tsx` so that **all pages** (`/`, `/dashboard`, `/events`, `/events/[id]/leads`, `/not-found`, and future routes) automatically display a consistent top navigation.
- **Unified Navigation Items**:
  - **Brand Logo & Title**: LeadPilot AI (links to `/dashboard` or `/`).
  - **Instant Generator**: Link to `/dashboard` (Instant AI demographic lead generator).
  - **Automated Search Events**: Link to `/events` (CRUD table & daily recurring scrapers with badge).
- **Tenant & Safety Indicators**:
  - Status badge: "Zero Duplicates Active".
  - Tenant badge: Active workspace indicator (`ws_dev_default`).
- **DRY & Surgical Clean-up**:
  - Remove redundant local headers and manual `<Navbar />` inclusions from `page.tsx` (home), `events/page.tsx`, and `events/[id]/leads/page.tsx` so there is never duplicate rendering or layout shift.

---

## 2. Files to be Modified

Following **Rule 5 (Single Responsibility Principle)** and **Rule 6 (Surgical Code Modifications)**:

| File Path | Responsibility & Planned Changes |
| :--- | :--- |
| `frontend/src/components/navigation/Navbar.tsx` | Enhanced navigation links (Instant Generator `/dashboard`, Automated Search Events `/events`), active route highlighting, and responsive desktop/mobile layout matching user screenshot. |
| `frontend/src/app/layout.tsx` | Imported and rendered `<Navbar />` above `{children}` so every route in the app automatically has the header. |
| `frontend/src/app/page.tsx` | Removed the hardcoded redundant header element to prevent double headers on the landing page. |
| `frontend/src/app/events/page.tsx` | Removed the manual `<Navbar />` call since it is now provided globally by the root layout. |
| `frontend/src/app/events/[id]/leads/page.tsx` | Removed the manual `<Navbar />` call since it is now provided globally by the root layout. |
| `frontend/src/app/dashboard/page.tsx` | Adjusted top padding container for clean layout fit under global header. |
| `frontend/src/app/not-found.tsx` | Adjusted padding and removed redundant home link. |

---

## 3. Database Schema & API Contract Alterations
- **None**: This is a pure frontend layout and UI architecture enhancement. No database migrations or backend endpoints are modified.

---

## 4. Step-by-Step Execution Order

1. **Step 1 (Navbar Enhancement)**:
   - [x] Update `frontend/src/components/navigation/Navbar.tsx` with screenshot design, `Instant Generator` (`/dashboard`), and `Automated Search Events` (`/events`) with dynamic route detection via `usePathname()`.
2. **Step 2 (Root Layout Integration)**:
   - [x] Mount `<Navbar />` in `frontend/src/app/layout.tsx` inside the body wrapper.
3. **Step 3 (Deduplication of Local Headers)**:
   - [x] Remove redundant local header in `frontend/src/app/page.tsx`.
   - [x] Remove redundant `<Navbar />` calls in `frontend/src/app/events/page.tsx` and `frontend/src/app/events/[id]/leads/page.tsx`.
   - [x] Clean padding in `frontend/src/app/dashboard/page.tsx` and `frontend/src/app/not-found.tsx`.
4. **Step 4 (Verification & Testing)**:
   - [x] Run `npm run typecheck` across all workspaces to guarantee zero type errors.
   - [x] Run `npm test` across the monorepo to ensure full test suite passes.
   - [x] Run `npm --workspace=frontend run build` to verify Next.js compiles all pages cleanly.
5. **Step 5 (Documentation & Git Push)**:
   - [x] Update `.agents/task.md`, `.agents/memory.md`, and record Task #021 in `.agents/TASK_LOG.md`.
   - [x] Stage, commit, and push changes to GitHub `origin/main` (commit `f7da703`).

---

## 5. Verification & Testing Strategy
- **Compiler & Typecheck**: Full TypeScript compile verification with `tsc --noEmit`.
- **Next.js Production Build**: Verify that static and dynamic pages (`/`, `/_not-found`, `/dashboard`, `/events`, `/events/[id]/leads`) generate without hydration mismatches or layout bugs.
- **Route Navigation Integrity**: Verify that clicking navigation links correctly shifts active highlighting and preserves URL routes.
