# Task Execution Roadmap (Phase 1: Foundation & Core MVP)

> **Execution Directive**: Tasks must be completed sequentially. Every task requires verification via automated tests and TypeScript checks before checking the box. After completing a milestone, update `task.md` and `memory.md`.

---

## 🎯 Phase 1: Foundation & Core MVP

### Phase 1.1: Monorepo Workspace & Configuration Architecture
- [ ] Initialize monorepo structure with standard workspaces (`/apps/web`, `/apps/api`, `/packages/database`, `/packages/shared-types`).
- [ ] Configure root `package.json` with npm/pnpm workspaces and scripts (`dev`, `build`, `test`, `lint`).
- [ ] Establish shared base `tsconfig.json` configurations with strict typing enabled across all packages.
- [ ] Setup root environment template (`.env.example`) and `.gitignore` preventing secret leaks.

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
- [ ] Build root dashboard layout with sidebar navigation (Leads, Campaigns, Inbox, Settings, Analytics).
- [ ] Create workspace switcher linked to Clerk Organizations.
- [ ] Build Seller Profile Settings page (`/settings/profile`) allowing users to configure agency name, sender email, pitch angle, logo URL, and portfolio links.
- [ ] Wire Seller Profile form to backend REST API (`POST /api/sender-profiles`) with optimistic UI updates.
