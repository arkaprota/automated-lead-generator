# Task Execution Roadmap (Phase 1: Foundation & Core MVP)

> **Execution Directive**: Tasks must be completed sequentially. Every task requires verification via automated tests and TypeScript checks before checking the box. After completing a milestone, update `task.md` and `memory.md`.

---

## 🎯 Phase 1: Foundation & Core MVP

### Phase 1.1: Monorepo Workspace & Configuration Architecture
- [x] Initialize monorepo structure with standard workspaces (`backend`, `frontend`, `packages/shared-types`, `packages/utils`, `packages/database`).
- [x] Configure root `package.json` with npm workspaces and unified scripts (`dev`, `build`, `test`, `typecheck`).
- [x] Establish shared base `tsconfig.base.json` configurations with strict typing enabled across all packages.
- [x] Setup root environment template (`.env.example`) and `.gitignore` preventing secret leaks.

### Phase 1.2: Multi-Tenant PostgreSQL Schema & Neon RLS
- [ ] Define PostgreSQL `schema.sql` supporting tables: `workspaces`, `users`, `workspace_members`, `sender_profiles`, `leads`, `campaigns`, `email_events`.
- [ ] Implement Row-Level Security (RLS) policies on all tenant tables using `current_setting('app.current_workspace_id', true)`.
- [ ] Configure workspace-wide lead deduplication indexes: `(workspace_id, google_place_id)`, `(workspace_id, website)`, and `(workspace_id, email)`.
- [ ] Generate Drizzle / Prisma ORM schema companion (`schema.ts`) and create transactional `withTenantContext` runner.

### Phase 1.3: Clerk Multi-Tenant Authentication & Workspace Sync
- [ ] Configure Clerk middleware and SDK integration on frontend and backend.
- [ ] Implement Clerk Organization mapping (1:1 mapping between Clerk Org and PostgreSQL Workspace).
- [ ] Create Clerk Webhook route (`/api/webhooks/clerk`) to sync user creation, organization creation, and membership changes into PostgreSQL.
- [ ] Implement `tenantMiddleware` extracting `workspace_id` from auth headers/claims.

### Phase 1.4: Express Server Boilerplate & Real-Time Socket.io Layer
- [ ] Build Express application boilerplate with CORS, JSON body parser, and centralized Zod validation middlewares.
- [ ] Implement health check route (`GET /api/health`) returning uptime, memory usage, and database connection state.
- [ ] Attach HTTP server to Socket.io and establish multi-tenant room subscriptions (`workspace:<workspaceId>`).
- [ ] Create standardized error handling middleware with structured JSON error responses.

### Phase 1.5: Google Gemini AI Service Wrapper (Structured Outputs)
- [ ] Initialize Google Gemini client (`@google/genai`) with API key validation.
- [ ] Implement `expandTargetDemographic(demographic: string)` returning 5–10 specific Google Maps search queries with Zod schema validation.
- [ ] Implement `scoreAndQualifyLead(lead: RawLead)` computing score (0–100) and flagging `website: null` prospects as Hot Leads.
- [ ] Implement `generateBrochurePitch(lead, senderProfile)` returning structured pitch JSON for PDF synthesis.
- [ ] Implement `classifyReplyIntent(emailBody: string)` returning enum intent (`INTERESTED`, `NOT_INTERESTED`, `QUESTION`, etc.).
- [ ] Provide resilient heuristic fallbacks for offline testing environments.

### Phase 1.6: Next.js Dashboard Layout & Seller Profile Configuration
- [ ] Build root dashboard layout with sidebar navigation (Leads, Campaigns, Inbox, Settings, Analytics, AI Chat).
- [ ] Create workspace switcher linked to Clerk Organizations.
- [ ] Build Seller Profile Settings page (`/settings/profile`) allowing users to configure agency name, sender email, pitch angle, logo URL, and portfolio links.
- [ ] Wire Seller Profile form to backend REST API (`POST /api/sender-profiles`) with optimistic UI updates.

---

## 🤖 Phase 2: AI-Native Intelligence Layer

### Phase 2.1: AI Database Schema & Infrastructure
- [ ] Create `ai_conversations` table (workspace-scoped conversation sessions with metadata).
- [ ] Create `ai_messages` table (individual messages with role: `user` | `assistant` | `function_call` | `function_result`).
- [ ] Create `autopilot_rules` table (per-workspace automation rules: trigger type, conditions, action type, cooldown, enabled flag).
- [ ] Create `autopilot_executions` table (audit log of every auto-pilot action taken with status and timestamps).
- [ ] Create `ai_insights` table (cached recommendations with priority, type, expiry TTL, and action payloads).
- [ ] Apply RLS policies to all new AI tables using `workspace_id` column.
- [ ] Generate Drizzle ORM schema companions for all new tables.

### Phase 2.2: AI Command Center (Conversational Chat Assistant)
- [ ] Build `AIChatService` with Gemini function-calling integration and platform tool definitions.
- [ ] Define tool/function schemas for all platform actions (generate_leads, create_campaign, query_analytics, draft_email, search_leads, get_campaign_status).
- [ ] Implement conversation memory: load last 50 messages per workspace, persist new exchanges.
- [ ] Build SSE streaming endpoint (`POST /api/chat/message`) with chunked response delivery.
- [ ] Implement action confirmation protocol for destructive operations (JSON card + user approval step).
- [ ] Build Next.js Chat Panel component: persistent sidebar panel with streaming message display, typing indicators, and action confirmation cards.
- [ ] Add `Cmd+K` keyboard shortcut to toggle chat panel focus.
- [ ] Wire chat history persistence and workspace-scoped session management.

### Phase 2.3: AI Auto-Pilot Workflows (Autonomous Sequences)
- [ ] Build `AIAutopilotService` with rule evaluation engine (trigger detection → condition matching → action execution).
- [ ] Implement `autopilot.worker.ts` BullMQ cron worker scanning for triggerable events on a configurable schedule.
- [ ] Implement follow-up sequence: detect email opens without reply after 48h → AI-draft follow-up → queue with review window.
- [ ] Implement question-reply handler: `QUESTION` intent reply → AI-generate informative response → queue for review/auto-send.
- [ ] Implement negative-reply handler: `NOT_INTERESTED` intent → auto-pause sequence → mark lead as cold.
- [ ] Implement AI-optimized send-time scheduling: analyze historical open/reply patterns → adjust dispatch windows.
- [ ] Implement lead re-engagement: identify stale high-score leads (30+ days inactive) → fresh pitch generation.
- [ ] Implement auto-escalation: `MEETING_REQUESTED` → calendar link suggestion + owner notification.
- [ ] Build Auto-Pilot Settings UI: toggle rules on/off, configure cooldowns, set review windows, view execution audit log.
- [ ] Emit Socket.io events for all auto-pilot actions (`autopilot:action_queued`, `autopilot:sequence_paused`).

### Phase 2.4: AI Insights & Proactive Recommendations Engine
- [ ] Build `AIInsightsService` with analytics aggregation and Gemini-powered trend analysis.
- [ ] Implement `insights.worker.ts` BullMQ worker running every 6 hours + triggered on significant data events.
- [ ] Define insight types: `opportunity`, `warning`, `trend`, `suggestion`, `health_alert`.
- [ ] Implement campaign health monitoring (bounce rates, spam complaints, reputation scoring).
- [ ] Implement lead scoring trend analysis with targeting optimization recommendations.
- [ ] Generate weekly AI summary digest (leads, emails, replies, conversions) as in-app card + optional email.
- [ ] Build Next.js AI Insights Dashboard Widget with priority-sorted insight cards and inline action buttons.
- [ ] Push real-time insights via Socket.io when new recommendations are generated.

### Phase 2.5: AI Email Composer (Real-Time Writing Assistant)
- [ ] Build `AIComposerService` with streaming Gemini text generation for email composition.
- [ ] Implement "Generate from Scratch" mode: natural language prompt → complete email with subject line.
- [ ] Implement "Rewrite / Improve" mode: existing copy → refined version with stronger CTAs and personalization.
- [ ] Implement A/B Variant Generator: one-click generation of 2–3 subject line and body variants.
- [ ] Implement tone control: parameter injection into Gemini system prompt (Professional / Casual / Urgent / Friendly).
- [ ] Implement dynamic personalization injection: auto-insert `{{businessName}}`, `{{painPoint}}`, `{{estimatedRoi}}` from lead data.
- [ ] Implement subject line optimizer with predicted open-rate scoring.
- [ ] Build spam/deliverability guard: scan for trigger words, excessive caps, missing unsubscribe → real-time health score.
- [ ] Build Next.js AI Composer component: inline editor toolbar with generate, rewrite, A/B, tone controls, and live preview.
- [ ] Integrate composer into campaign email editor and reply composer views.

