# LeadPilot AI - Autonomous Cold Email Outreach & Lead Generation SaaS

A production-grade, multi-tenant monorepo for automated B2B lead generation, dynamic PDF brochure synthesis, and cold outreach dispatch.

## 🏗️ Architecture & Tech Stack

- **Monorepo Structure**:
  - `/frontend`: Next.js (React 19), Tailwind CSS, Clerk Authentication, Socket.io client.
  - `/backend`: Node.js, Express.js, TypeScript, Drizzle ORM, Google Gemini AI, BullMQ.
- **Database**: PostgreSQL (Neon Serverless) with **Row-Level Security (RLS)** for strict tenant isolation based on `workspace_id`.
- **Queue & Background Jobs**: Upstash Redis with BullMQ (multi-tenant fair-share round-robin processing and rate-limiting).
- **Real-Time Layer**: Socket.io for live desktop notifications on positive replies.
- **AI Engine**: Google Gemini API (`gemini-2.5-flash`) with structured outputs.
- **Documentation & Agent Workspace**: Managed under [`.agents/`](.agents/) following Documentation-Driven Development (DDD).

---

## 📚 Documentation & System Design

All project specifications, architecture blueprints, rules, and task roadmaps are organized in the [`.agents/`](.agents/) directory:
- [`.agents/prd.md`](.agents/prd.md) — Product Requirements Document & Persona Profiles
- [`.agents/architecture.md`](.agents/architecture.md) — System Topology, Data Flows & Mermaid Diagrams
- [`.agents/rules.md`](.agents/rules.md) — Architectural Invariants, RLS Enforcement & Coding Standards
- [`.agents/design.md`](.agents/design.md) — UI/UX Design System, Color Tokens & Component Specifications
- [`.agents/task.md`](.agents/task.md) — Phase 1 Sequential Execution Roadmap & Milestones
- [`.agents/memory.md`](.agents/memory.md) — Active Project State, Completed Logs & Feature Registry
- [`.agents/TASK_LOG.md`](.agents/TASK_LOG.md) — Immutable Audit Trail of Every Prompt & Task Executed
- [`DEVELOPER_GUIDE.md`](DEVELOPER_GUIDE.md) — Complete Developer Onboarding, Local Setup & Workflow Guide

---

## ⚡ Core System Pipelines

### 1. The "AI-Scraper-AI" Lead Generation Engine
- **Step A (Intent Translation)**: Gemini expands user target demographic intent (e.g., *"Web design clients in Kolkata"*) into 5 specific search queries.
- **Step B (Google Maps Scraping)**: Scrapes raw B2B data (business name, website, phone, address, place_id).
- **Step C (AI Scoring & Qualification)**: Feeds raw data back to Gemini. Detects missing websites to flag high-value **Hot Leads** for web design services, scoring leads from 0 to 100.
- **Step D (PostgreSQL Persistence)**: Persists leads under the active `workspace_id` enforcing Row-Level Security and workspace-level deduplication.

### 2. Dynamic PDF Brochure Generation
- Gemini generates personalized pitch content (pain points, estimated ROI, solutions, and CTA) returning strict JSON.
- Merges the Gemini JSON with the sender's static profile data from PostgreSQL.
- Compiles the payload into an EJS template and renders a PDF buffer via Puppeteer.
- Uploads the PDF to cloud storage and saves the public brochure URL to the campaign.

### 3. Email Dispatch & Webhook Loop
- **Dispatch**: BullMQ pulls queued jobs from Redis and throttles dispatch at a human-like pace. Includes personalized brochure link in email.
- **Receiving**: Express webhook endpoint (`/api/webhooks/email-replies`) catches incoming replies.
- **Classification**: Gemini classifies incoming replies (`INTERESTED`, `NOT_INTERESTED`, `QUESTION`, `NEUTRAL`).
- **Live Notifications**: Emits real-time Socket.io event to flash positive response toasts directly in the Next.js dashboard.

---

## 🚀 Getting Started

### 1. Environment Configuration

Copy the example environment files:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 2. Installation & Running

Install dependencies and start development servers:

```bash
# Start backend API (port 5000)
npm run dev:backend

# Start frontend dashboard (port 3000)
npm run dev:frontend
```

### 3. Database Migration
Deploy the PostgreSQL schema with Row-Level Security:
```bash
# Apply schema to Neon PostgreSQL
psql $DATABASE_URL -f backend/src/db/schema.sql
```

---

## 🧪 Testing

Run backend integration test suite:
```bash
npm run test:backend
```
