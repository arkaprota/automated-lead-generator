# Product Requirements Document (PRD)

## Document Information
- **Product Name:** LeadPilot AI (Enterprise B2B Cold Outreach & Autonomous Lead Engine)
- **Document Version:** 1.0.0
- **Status:** Approved / Active Baseline
- **Date:** October 13, 2026
- **Architecture Strategy:** Documentation-Driven Development (DDD) & Multi-Tenant Monorepo

> *Note on Scope & Evolution:* Features defined in this document are modular and subject to iterative updates, additions, or alterations as platform requirements, user feedback, and market demands evolve.

---

## 1. Executive Summary & Vision

**LeadPilot AI** is an autonomous, multi-tenant AI Cold Email Outreach and B2B Lead Generation SaaS platform. It automates the entire top-of-funnel customer acquisition lifecycle:
1. Translating natural-language service offerings and target demographics into precision search queries.
2. Scraping high-density B2B records from Google Maps and local business indexes.
3. Leveraging Google Gemini AI structured outputs to qualify prospects, score leads (0–100), and flag prime opportunities (e.g. missing websites).
4. Generating personalized, branded, dynamic A4 PDF brochures per prospect that outline custom pain points, tailored technical solutions, and ROI projections.
5. Drip-feeding email outreach through a fair-share multi-tenant queue (Upstash Redis + BullMQ) with human-like deliverability pacing.
6. Catching inbound prospect replies via webhooks, triaging response sentiment with Gemini AI, and notifying account owners in real-time via WebSockets.

---

## 2. Problem Statement & Value Proposition

### The Critical Bottlenecks in Modern Cold Outreach:
- **Manual, Fragmented Lead Scraping:** Sales professionals spend 15–20 hours per week manually searching Google Maps, copying contact details into spreadsheets, and filtering junk listings.
- **Low-Converting, Generic Pitch Emails:** 92% of cold emails are ignored because templates lack prospect-specific context, personalization, and compelling tangible deliverables.
- **Painful Brochure Customization:** Creating bespoke pitch decks or PDF proposals for each prospective client is economically unfeasible for small teams and solo agencies.
- **Delayed Inbox Response Times:** Leads go cold within 60 minutes of expressing interest; manual inbox monitoring across multiple accounts causes missed deals.
- **Deliverability Penalties:** Bulk outbound campaigns without tenant fairness or rate pacing trigger spam traps and burn sender domain reputations.

### The LeadPilot Solution:
LeadPilot AI turns a simple user input (e.g., *"Web designer looking for dental clinics in Kolkata"*) into a fully automated lead discovery, dynamic pitch deck synthesis, and fair-share outreach machine—delivering high-intent leads to the user's dashboard in real time.

---

## 3. Target User Personas

| Persona | Core Needs | Primary Value Realized |
| :--- | :--- | :--- |
| **Freelance Web Developers & Designers** | Finding local businesses with no website or outdated tech. | Automated discovery of "Hot Leads" with missing sites + auto-generated website revamp PDF pitch. |
| **B2B Growth & Marketing Agencies** | Scaling client acquisition across multiple client workspaces. | Multi-tenant campaign isolation, round-robin dispatch queues, and personalized ROI brochures. |
| **Sales Development Reps (SDRs)** | Fast lead qualification and rapid triage of interested replies. | Automated lead scoring (0–100) and instant real-time Socket.io notifications on positive replies. |
| **Solopreneurs & Technical Founders** | Zero-touch outbound sales pipeline without hiring a sales team. | End-to-end "AI-Scraper-AI" pipeline running autonomously in the background. |

---

## 4. Core System Pipelines & Functional Requirements

### 4.1 Pipeline 1: The "AI-Scraper-AI" Lead Generation Engine
- **User Intent Input:** User provides their profession, service offer, and target geographical market (e.g., *"Shopify developer looking for fashion boutiques in London"*).
- **Step A — Query Expansion (Google Gemini API):**
  - Translates broad user intent into 5–10 hyper-specific Google Maps search queries engineered to find prospects suffering from specific pain points.
  - Returns strict JSON schema: `{ queries: string[], rationale: string }`.
- **Step B — B2B Maps Scraping (Maps Scraper API / Playwright):**
  - Scrapes business name, phone number, physical address, Google rating, review count, categories, and website URL.
- **Step C — AI Qualification & Scoring (Gemini Structured Outputs):**
  - Evaluates each raw scraped record against strict qualification heuristics:
    - `website: null` or empty ➡️ Flagged as **Hot Lead** with urgent pitch angle.
    - `website` exists but low rating / unoptimized presence ➡️ Flagged as **Warm Lead**.
  - Computes `lead_score` (integer 0–100) and structured array of `qualification_reasons`.
- **Step D — Multi-Tenant Persistence & Display:**
  - Persists leads to PostgreSQL under the user's active `workspace_id`.
  - Enforces workspace-level deduplication: `UNIQUE(workspace_id, google_place_id)` and `UNIQUE(workspace_id, website)`.
  - Renders leads in a sortable, filterable Next.js Data Table with quick actions.

### 4.2 Pipeline 2: Dynamic AI Brochure (PDF) Generator
- **Static Seller Context:** Retrieves agency profile from PostgreSQL (`company_name`, `sender_name`, `logo_url`, `portfolio_links`, `case_studies`).
- **Dynamic AI Pitch Synthesis (Gemini Structured Outputs):**
  - Generates bespoke pitch JSON:
    - `headline`: High-impact prospect-tailored headline.
    - `painPoints`: 3 specific market/online gaps identified for this business.
    - `tailoredSolution`: Strategic solution mapped to the seller's capabilities.
    - `estimatedRoi`: Realistic, compelling ROI projection.
    - `callToAction`: Clear next step (e.g., *"Book a 15-minute audit call"*).
- **Template Compilation & Headless PDF Rendering:**
  - Injects merged static + dynamic JSON into an EJS/Handlebars HTML template.
  - Puppeteer / PDF API renders a pixel-perfect, branded A4 PDF buffer.
  - Uploads PDF buffer to cloud storage (Backblaze B2 / Cloudinary).
  - Stores public URL in the campaign lead record (`pdf_brochure_url`).

### 4.3 Pipeline 3: Fair-Share Email Dispatch & Autonomous Reply Loop
- **Multi-Tenant Round-Robin Queue (Upstash Redis + BullMQ):**
  - Manages outbound dispatch jobs grouped by `workspace_id`.
  - Ensures round-robin fairness so heavy batch sends from one tenant never starve other tenants.
  - Implements human-like rate pacing with randomized delays (jitter) to protect mailbox reputation.
- **Email Sending Protocol:**
  - Connects to user mailboxes via OAuth/Universal Email API (Nylas/Aurinko) or custom SMTP.
  - Automatically embeds the prospect's personalized brochure public link inside the body copy.
- **Inbound Webhook Catching:**
  - Express webhook route (`POST /api/webhooks/email-replies`) listens for incoming prospect responses.
- **Sentiment & Intent Triage (Gemini API):**
  - Classifies reply text into strict Enums:
    - `INTERESTED`
    - `MEETING_REQUESTED`
    - `QUESTION`
    - `NOT_INTERESTED`
    - `OUT_OF_OFFICE`
  - Pre-drafts a context-aware follow-up email response for immediate review.
- **Real-Time Live UI Notification:**
  - If classified as `INTERESTED` or `MEETING_REQUESTED`, emits real-time WebSocket event (`lead:positive_reply`).
  - Next.js dashboard flashes an ambient, high-priority desktop toast alert with sound and inline thread preview.

---

## 5. Non-Functional Requirements & System Goals

- **Data Isolation & Security:** Neon PostgreSQL Row-Level Security (RLS) ensures zero data leakage across multi-tenant workspaces.
- **High Deliverability:** Outbound rate limits strictly enforced per domain (default: max 20–50 emails per sender mailbox per day).
- **Zero-Hallucination AI:** Strict structured JSON schemas (`responseMimeType: 'application/json'`) with Zod schema validation; resilient heuristic fallbacks for offline/test environments.
- **Sub-Second Real-Time Latency:** Socket.io room broadcasts deliver positive reply alerts to client dashboards within 500ms of webhook ingestion.
- **Scalability:** Stateless Express API servers decoupled from BullMQ background worker instances.
