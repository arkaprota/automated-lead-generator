# 🛠️ LeadPilot AI — Developer Onboarding & Workflow Guide

Welcome to the **LeadPilot AI** engineering repository. This document provides everything you need to set up, understand, develop, test, and contribute to the platform smoothly.

---

## 📑 Table of Contents
1. [Architecture & Monorepo Topology](#1-architecture--monorepo-topology)
2. [Prerequisites](#2-prerequisites)
3. [Environment Configuration](#3-environment-configuration)
4. [Installation & Setup](#4-installation--setup)
5. [Running the Application Locally](#5-running-the-application-locally)
6. [Testing & Quality Verification](#6-testing--quality-verification)
7. [Engineering Standards & Core Rules](#7-engineering-standards--core-rules)
8. [Troubleshooting & Common Gotchas](#8-troubleshooting--common-gotchas)

---

## 1. Architecture & Monorepo Topology

LeadPilot AI is architected as a **multi-tenant monorepo** with strict separation of concerns:

```
automated-leads-generator/
│
├── 📂 backend/                      # Express.js REST API, Workers & Real-Time Engine
│   ├── src/controllers/             # HTTP request handling & response mapping
│   ├── src/routes/                  # Express domain route definitions
│   ├── src/services/                # Business logic (Gemini AI, Puppeteer, BullMQ, Socket.io)
│   ├── src/workers/                 # Background queues (email dispatch, auto-pilot)
│   └── src/server.ts                # Main server entrypoint (Port 5000)
│
├── 📂 frontend/                     # Next.js 15 (App Router, React 19) Dashboard
│   ├── src/app/                     # Pages: /dashboard, /leads, /campaigns, /settings
│   ├── src/components/ui/           # Reusable atomic UI primitives
│   ├── src/components/features/     # Lead tables, chat panel, campaign wizards
│   └── src/lib/                     # Client API fetchers & Socket.io listeners
│
├── 📂 packages/                     # 🔄 Shared Workspace Libraries (100% Reusable)
│   ├── shared-types/                # Domain models, TypeScript interfaces, Zod schemas & enums
│   ├── utils/                       # Pure isomorphic helpers (formatters, date, validators)
│   └── database/                    # Drizzle ORM schemas & withTenantContext RLS runner
│
└── 📂 .agents/                      # 🧠 Single Source of Truth & Governance
    ├── prd.md                       # Product Requirements Document
    ├── architecture.md              # System Topology & Mermaid Diagrams
    ├── rules.md                     # Engineering Standards & Rulebooks
    └── TASK_LOG.md                  # Chronological audit log of all completed tasks
```

---

## 2. Prerequisites

Make sure the following tools are installed on your machine:
- **Node.js**: `v20.0.0` or higher ([Download Node.js](https://nodejs.org/))
- **npm**: `v10.0.0` or higher (bundled with Node.js)
- **Git**: For version control
- **Redis**: Running locally (`127.0.0.1:6379`) or an Upstash/Render cloud instance
- **PostgreSQL**: A Neon Serverless PostgreSQL database (or local Postgres instance)
- **External Accounts / API Keys**:
  - Google Gemini API key ([Google AI Studio](https://aistudio.google.com/))
  - Clerk Auth account ([Clerk Dashboard](https://dashboard.clerk.com/))

---

## 3. Environment Configuration

The monorepo contains a master template [`.env.example`](.env.example) in the root directory. You must configure environment files for both `/backend` and `/frontend`.

### A. Backend Configuration (`backend/.env`)
Create a file at `backend/.env` (copy from `backend/.env.example`):
```bash
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# PostgreSQL (Neon Database with active RLS)
DATABASE_URL=postgresql://user:password@ep-sample-12345.us-east-2.aws.neon.tech/neondb?sslmode=require

# Redis for BullMQ Queues (Local or Cloud)
REDIS_URL=redis://127.0.0.1:6379

# Google Gemini AI API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Clerk Authentication (Secret keys)
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
```

### B. Frontend Configuration (`frontend/.env.local`)
Create a file at `frontend/.env.local` (copy from `frontend/.env.example`):
```bash
# Clerk Authentication (Public publishable keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Backend API & Socket.io Server Endpoints
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

---

## 4. Installation & Setup

Install dependencies for backend and frontend independently:

```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

Or from the root directory:
```bash
npm --prefix backend install
npm --prefix frontend install
```

Both `/backend` and `/frontend` maintain their own self-contained `node_modules` and `package.json`.

---

## 5. Running the Application Locally

In development, start the backend and frontend in separate terminal windows:

### Terminal 1: Start Backend (API + Socket.io + BullMQ)
```bash
npm run dev:backend
```
- **Server:** Runs at `http://localhost:5000`
- **Health Check:** `http://localhost:5000/api/health`
- **Live Logs:** Shows Express HTTP requests and BullMQ worker job updates.

### Terminal 2: Start Frontend (Next.js 15)
```bash
npm run dev:frontend
```
- **Web App:** Runs at `http://localhost:3000`
- **Dashboard:** Open `http://localhost:3000/dashboard` in your browser.

---

## 6. Testing & Quality Verification

Before committing any code or considering a task done, you **MUST** run all verification suites:

```bash
# 1. Run backend unit and integration test suite (Vitest)
npm run test

# 2. Run TypeScript compiler checks for backend and frontend (Zero errors allowed)
npm run typecheck:backend
npm run typecheck:frontend
```

Both commands must exit with code `0`. If any type error, lint warning, or failing test appears, resolve it immediately.

---

## 7. Engineering Standards & Core Rules

Every developer and AI agent working in this repo is bound by the rules in [`AGENTS.md`](AGENTS.md) and [`.agents/rules.md`](.agents/rules.md):

1. **Rule 1: Strict Frontend / Backend Separation**
   - NEVER put backend database connections, secrets (`GEMINI_API_KEY`, `DATABASE_URL`), scraping code, or BullMQ queues inside `/frontend`.
2. **Rule 2: Zero-Error Policy**
   - Always run `npm test` and `npm run typecheck` before pushing. No unfinished errors or lint warnings.
3. **Rule 3: Multi-Tenant Row-Level Security (RLS)**
   - All tenant queries MUST run inside `withTenantContext(workspaceId, (tenantDb) => ...)` to set `SET LOCAL app.current_workspace_id = ...`.
4. **Rule 5: Single Responsibility Principle (SRP) per File**
   - Every separate concept gets its own file. Separate files for each enum (`*.enum.ts`), each schema (`*.schema.ts`), each interface (`*.interface.ts`), each route, controller, service, and repository. No monolithic catch-all files.
5. **Rule 6: Surgical Code Changes (Change Only What Is Required)**
   - Modify only the required lines of code. Never rewrite entire files or touch working code outside your task scope.
6. **Rule 9: Implementation Plan Before Major Features**
   - Always construct and present a structured implementation plan outlining files, scope, and verification steps before coding.
7. **Rule 10: 5-Stage Engineering Lifecycle & Auto Git Push**
   - **Stage 1 (Coding)** ➔ **Stage 2 (Debugging)** ➔ **Stage 3 (Testing Loop)** ➔ **Stage 4 (Docs Sync in `.agents/`)** ➔ **Stage 5 (Git Push to `origin/main`)**.

---

## 8. Troubleshooting & Common Gotchas

| Issue | Cause | Fix |
|---|---|---|
| `Redis connection refused (127.0.0.1:6379)` | Local Redis is not running | Start Redis (`redis-server`) or update `REDIS_URL` in `backend/.env` with an Upstash connection string. |
| `Neon RLS Permission Denied` | Missing `workspace_id` in context | Ensure all database operations wrap queries with `withTenantContext(workspaceId, ...)`. |
| Port 5000 or 3000 already in use | Another process running | Kill the conflicting process or change the port in `.env` / Next.js flags (`PORT=3001 npm run dev:frontend`). |

---

*Need more details? Check [`.agents/prd.md`](.agents/prd.md) for product specs and [`.agents/architecture.md`](.agents/architecture.md) for data flow sequence diagrams.*
