# System Architecture Document

## Document Information
- **System Name:** LeadPilot AI Platform Architecture
- **Version:** 1.0.0
- **Status:** Approved Baseline
- **Date:** October 13, 2026

---

## 1. High-Level Architectural Overview

LeadPilot AI is architected as an enterprise-grade, multi-tenant monorepo. It cleanly decouples client presentation, API orchestration, background queuing, distributed worker processing, and relational persistence.

```
                                  ┌──────────────────────────────────────────────┐
                                  │            Next.js App Router (UI)           │
                                  │       (Clerk Auth + Socket.io-client)        │
                                  └───────────────────────┬──────────────────────┘
                                                          │ HTTP REST / WebSocket
                                                          ▼
                                  ┌──────────────────────────────────────────────┐
                                  │           Express.js API Gateway             │
                                  │   (Tenant Middleware + Drizzle / Prisma)     │
                                  └───────────┬───────────────┬──────────────┬───┘
                                              │               │              │
                   ┌──────────────────────────┘               │              └────────────────────────┐
                   ▼                                          ▼                                       ▼
      ┌─────────────────────────┐               ┌──────────────────────────┐             ┌─────────────────────────┐
      │     Google Gemini API   │               │  PostgreSQL (Neon) RLS   │             │   Upstash Redis &       │
      │  (Structured Outputs)   │               │   Tenant Data Isolation  │             │   BullMQ Queues         │
      └─────────────────────────┘               │   (SET LOCAL ws_id)      │             │  (Fair-Share Workers)   │
                                                └──────────────────────────┘             └────────────┬────────────┘
                                                                                                      │
                                                                                                      ▼
                                                                                         ┌─────────────────────────┐
                                                                                         │  Outreach & Scraping    │
                                                                                         │  - Puppeteer / PDF API  │
                                                                                         │  - Backblaze B2 / Cloud │
                                                                                         │  - Nylas / SMTP Dispatch│
                                                                                         └─────────────────────────┘
```

---

## 2. Technology Stack

### 2.1 Frontend Client
- **Framework:** Next.js 15 (React 19, App Router)
- **Styling & Components:** Tailwind CSS, Shadcn UI / Radix Primitives, Lucide Icons
- **Authentication:** Clerk (Multi-tenant Organizations & Role-Based Access Control)
- **Real-Time Client:** `socket.io-client` (Room-based tenant subscriptions)
- **State & Data Fetching:** React Server Components (RSC) + TanStack Query

### 2.2 Backend API & Orchestration
- **Runtime & Server:** Node.js, Express.js, TypeScript (Strict Mode)
- **Real-Time Engine:** `socket.io` (Tenant room multiplexing `workspace:<id>`)
- **Validation:** Zod (Request bodies, query params, environment configs, AI JSON schemas)
- **Template Compilation:** EJS / Handlebars (Brochure HTML rendering)

### 2.3 Persistence & Multi-Tenancy
- **Database:** PostgreSQL on Neon Serverless with Row-Level Security (RLS)
- **Tenant Isolation Policy:** Every table contains `workspace_id`. Sessions execute `SET LOCAL app.current_workspace_id = :workspaceId`.
- **ORM / Query Builder:** Drizzle ORM (Zero-overhead, native Neon RLS support) / Prisma
- **Billing:** Stripe (Metered subscription tiers, usage-based credits)

### 2.4 Queuing, Caching & Workers
- **Message Broker:** Upstash Redis (Serverless Redis instance)
- **Queue Engine:** BullMQ
  - Multi-tenant Round-Robin fair scheduling
  - Human-like outbound rate limiting (configurable daily limits & send windows)
  - Automatic exponential backoff retries

### 2.5 External Integrations & AI Engine
- **AI Engine:** Google Gemini API (`gemini-2.5-flash` with structured outputs)
- **Data Scraping:** Google Maps Scraping API (Outscraper / SerpApi / Playwright)
- **PDF Generation:** Serverless Puppeteer / PDF API (Doppio / PDFBolt)
- **Cloud Storage:** Backblaze B2 / Cloudinary (Brochure PDF hosting)
- **Outbound / Inbound Email:** Nylas Universal Email API / Aurinko / Custom SMTP + Inbound Parse Webhooks

---

## 3. Monorepo Directory Tree

```
automated-leads-generator/
├── prd.md                                # Product Requirements Document
├── architecture.md                       # System Architecture (this document)
├── rules.md                              # Development Rules & Coding Standards
├── design.md                             # UI/UX Design System Specifications
├── task.md                               # Phase 1 Execution Roadmap
├── memory.md                             # Project Memory & Feature State Registry
├── package.json                          # Root monorepo workspace configuration
├── .gitignore
├── apps/                                 # Production monorepo apps
│   ├── web/                              # Next.js Frontend Application
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── tailwind.config.ts
│   │   └── src/
│   │       ├── app/                      # Next.js App Router (dashboard, campaigns, leads)
│   │       ├── components/               # Shadcn UI & custom presentation components
│   │       │   ├── table/                # Interactive Lead Data Table
│   │       │   ├── brochure/             # PDF Template Previewer
│   │       │   └── notifications/        # Live Socket Toast Listeners
│   │       └── lib/                      # Client-side API wrappers & Socket singletons
│   └── api/                              # Express.js Backend API Server
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── config/                   # Singletons (env, db, redis, gemini)
│           ├── db/                       # PostgreSQL schema.sql & Drizzle schema.ts
│           ├── middleware/               # Tenant RLS, Auth, Zod Validation, Error handler
│           ├── routes/                   # Domain routes (leads, ai, campaigns, webhooks)
│           ├── services/                 # GeminiService, BrochureService, QueueService, SocketService
│           ├── workers/                  # BullMQ background dispatch processors
│           └── server.ts                 # Express + HTTP + Socket.io entrypoint
└── packages/                             # Shared packages
    ├── database/                         # Shared DB connection & migrations
    └── shared-types/                     # Shared TypeScript domain contracts & Zod schemas
```

---

## 4. End-to-End Data Flow Diagrams

### 4.1 Pipeline 1: AI-Scraper-AI Lead Discovery & Qualification

```mermaid
sequenceDiagram
    autonumber
    actor User as Next.js Client
    participant API as Express API
    participant Gemini as Google Gemini API
    participant Scraper as Maps Scraper API
    participant DB as Neon PostgreSQL (RLS)

    User->>API: POST /api/leads/generate { demographic: "Web design Kolkata" }
    API->>Gemini: Translate intent into 5 specific Google Maps queries
    Gemini-->>API: JSON: { queries: ["Web design agency...", ...] }
    API->>Scraper: Execute maps search queries
    Scraper-->>API: Raw B2B records (Name, Phone, Address, Website)
    API->>Gemini: Score & Qualify leads (flag null website as "Hot Lead")
    Gemini-->>API: JSON: { leadScore: 92, status: "hot", reasons: [...] }
    API->>DB: SET LOCAL app.current_workspace_id = ws_id
    API->>DB: INSERT INTO leads (dedup on workspace_id + place_id/website)
    DB-->>API: Saved lead records
    API-->>User: HTTP 201 + Scored leads payload
```

### 4.2 Pipeline 2: Dynamic PDF Brochure Synthesis

```mermaid
sequenceDiagram
    autonumber
    participant Worker as BullMQ / Express
    participant DB as Neon PostgreSQL
    participant Gemini as Google Gemini API
    participant Puppeteer as EJS + Headless PDF
    participant Cloud as Cloud Storage (B2/Cloudinary)

    Worker->>DB: Fetch Lead Data & Sender Profile (RLS context)
    DB-->>Worker: Prospect info + Agency branding details
    Worker->>Gemini: Generate tailored pitch JSON (pain points, ROI, solutions)
    Gemini-->>Worker: JSON: { headline, painPoints, solution, estimatedRoi, cta }
    Worker->>Puppeteer: Merge JSON into EJS template -> Render A4 PDF Buffer
    Puppeteer-->>Worker: PDF Buffer (binary)
    Worker->>Cloud: Upload PDF buffer (brochures/lead_id.pdf)
    Cloud-->>Worker: Public brochure URL
    Worker->>DB: UPDATE leads SET pdf_brochure_url = publicUrl
```

### 4.3 Pipeline 3: Fair-Share Queue Dispatch

```mermaid
sequenceDiagram
    autonumber
    actor User as Campaign Manager
    participant API as Express API
    participant Redis as Upstash Redis (BullMQ)
    participant Worker as Dispatch Worker
    participant Mail as Nylas / SMTP Gateway

    User->>API: POST /api/campaigns/:id/dispatch
    API->>Redis: Enqueue jobs partitioned by workspace_id
    Note over Redis,Worker: Multi-tenant Round-Robin Fair Scheduler
    Worker->>Redis: Dequeue next tenant job (human jitter delay)
    Worker->>Mail: Send email with personalized brochure link
    Mail-->>Worker: Message ID / Dispatch confirmation
    Worker->>API: Update email_events (status: SENT)
```

### 4.4 Pipeline 4: Inbound Webhook Triage & Real-Time Alert Loop

```mermaid
sequenceDiagram
    autonumber
    actor Prospect as Prospect Inbox
    participant Mail as Inbound Parse Webhook
    participant API as Express Webhook Handler
    participant Gemini as Google Gemini API
    participant DB as Neon PostgreSQL
    participant Socket as Socket.io Server
    actor Dashboard as Next.js Dashboard UI

    Prospect->>Mail: Replies: "Yes, I am interested. Let's talk tomorrow."
    Mail->>API: POST /api/webhooks/email-replies
    API->>Gemini: Classify intent (Enum: INTERESTED, QUESTION, NOT_INTERESTED)
    Gemini-->>API: JSON: { intent: "INTERESTED", confidence: 0.95 }
    API->>DB: INSERT INTO email_events (lead_id, reply_body, intent)
    alt Intent is INTERESTED or MEETING_REQUESTED
        API->>Socket: Emit 'lead:positive_reply' to room `workspace:<ws_id>`
        Socket-->>Dashboard: Flash ambient desktop toast notification
    end
    API-->>Mail: HTTP 200 OK
```
