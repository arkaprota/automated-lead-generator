-- ==============================================================================
-- Cold Email Outreach & Lead Generation SaaS - PostgreSQL (Neon) Database Schema
-- Multi-Tenant Isolation with Row-Level Security (RLS)
-- ==============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. TENANTS & USERS (Clerk Auth Sync)
-- ==============================================================================

-- Workspaces table (Maps 1:1 with Clerk Organization or Root Workspace)
CREATE TABLE IF NOT EXISTS workspaces (
    id TEXT PRIMARY KEY, -- Clerk Organization ID (e.g., 'org_xxx') or UUID
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    owner_user_id TEXT NOT NULL, -- Clerk User ID
    plan VARCHAR(50) NOT NULL DEFAULT 'starter', -- starter, pro, agency
    credits_remaining INT NOT NULL DEFAULT 500,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users table (Clerk User synchronization)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, -- Clerk User ID (e.g., 'user_xxx')
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Workspace Members (Organization membership join table)
CREATE TABLE IF NOT EXISTS workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member', -- owner, admin, member
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_workspace_member UNIQUE (workspace_id, user_id)
);

-- ==============================================================================
-- 2. SENDER PROFILES & ASSETS
-- ==============================================================================

-- Sender Profiles for dynamic PDF brochure merging and outreach dispatch
CREATE TABLE IF NOT EXISTS sender_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    sender_name VARCHAR(255) NOT NULL,
    sender_email VARCHAR(255) NOT NULL,
    pitch_angle TEXT,
    company_description TEXT,
    logo_url TEXT,
    website_url TEXT,
    phone VARCHAR(50),
    nylas_grant_id TEXT, -- Nylas OAuth Grant ID for dispatch
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 3. CAMPAIGNS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    sender_profile_id UUID REFERENCES sender_profiles(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    target_demographic TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, active, paused, completed
    daily_limit INT NOT NULL DEFAULT 50,
    email_subject_template TEXT,
    email_body_template TEXT,
    schedule_config JSONB NOT NULL DEFAULT '{"sendWindowStart": "09:00", "sendWindowEnd": "18:00", "timezone": "UTC"}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 4. LEADS (AI-Scraper-AI Qualified Leads)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    event_id UUID, -- References search_events(id) ON DELETE SET NULL
    business_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(100),
    website TEXT,
    address TEXT,
    google_place_id VARCHAR(255),
    lead_score INT NOT NULL DEFAULT 0, -- Scored 0-100 by Gemini
    qualification_status VARCHAR(50) NOT NULL DEFAULT 'unqualified', -- hot, warm, cold, disqualified, unqualified
    qualification_reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
    raw_metadata JSONB NOT NULL DEFAULT '{}'::jsonb, -- Scraped Google Maps payload
    pdf_brochure_url TEXT, -- Cloudinary / B2 hosted URL
    brochure_pitch_data JSONB, -- Personalized pitch JSON generated by Gemini
    brochure_generated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Workspace-level deduplication constraints (Unique per workspace to prevent duplicate outreach)
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_workspace_place_id 
    ON leads(workspace_id, google_place_id) 
    WHERE google_place_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_workspace_website 
    ON leads(workspace_id, website) 
    WHERE website IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_workspace_email 
    ON leads(workspace_id, email) 
    WHERE email IS NOT NULL;

-- Query performance indexes
CREATE INDEX IF NOT EXISTS idx_leads_workspace_id ON leads(workspace_id);
CREATE INDEX IF NOT EXISTS idx_leads_campaign_id ON leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_leads_event_id ON leads(event_id);
CREATE INDEX IF NOT EXISTS idx_leads_lead_score ON leads(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_qualification_status ON leads(qualification_status);

-- ==============================================================================
-- 5. EMAIL EVENTS & WEBHOOK RESPONSES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS email_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    message_id VARCHAR(255), -- Nylas or SMTP Message ID
    event_type VARCHAR(50) NOT NULL, -- QUEUED, SENT, DELIVERED, OPENED, CLICKED, BOUNCED, REPLIED
    reply_intent VARCHAR(50), -- INTERESTED, NOT_INTERESTED, QUESTION, NEUTRAL (Classified by Gemini)
    reply_body TEXT,
    reply_snippet TEXT,
    pdf_url_included TEXT,
    raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_events_workspace_id ON email_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_email_events_campaign_id ON email_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_events_lead_id ON email_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_email_events_event_type ON email_events(event_type);
CREATE INDEX IF NOT EXISTS idx_email_events_reply_intent ON email_events(reply_intent);

-- ==============================================================================
-- 5b. SEARCH EVENTS (Automated Recurring Lead Generation Queries)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS search_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,
    schedule_cron VARCHAR(50) NOT NULL DEFAULT '0 9 * * *',
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, stopped, completed, failed
    query_prompt TEXT,
    total_leads_found INT NOT NULL DEFAULT 0,
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_events_workspace_id ON search_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_search_events_status ON search_events(status);

-- ==============================================================================
-- 6. ROW-LEVEL SECURITY (RLS) POLICIES FOR MULTI-TENANT ISOLATION
-- ==============================================================================

-- Enable RLS on all tenant-specific tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE sender_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;

-- Helper condition: Current workspace matches session setting OR bypass is enabled
-- In application sessions, execute: SET LOCAL app.current_workspace_id = 'org_xxx';

-- Workspaces Policy
CREATE POLICY workspace_isolation_workspaces ON workspaces
    USING (
        id = current_setting('app.current_workspace_id', true)
        OR current_setting('app.bypass_rls', true) = 'on'
    );

-- Workspace Members Policy
CREATE POLICY workspace_isolation_members ON workspace_members
    USING (
        workspace_id = current_setting('app.current_workspace_id', true)
        OR current_setting('app.bypass_rls', true) = 'on'
    );

-- Sender Profiles Policy
CREATE POLICY workspace_isolation_sender_profiles ON sender_profiles
    USING (
        workspace_id = current_setting('app.current_workspace_id', true)
        OR current_setting('app.bypass_rls', true) = 'on'
    );

-- Campaigns Policy
CREATE POLICY workspace_isolation_campaigns ON campaigns
    USING (
        workspace_id = current_setting('app.current_workspace_id', true)
        OR current_setting('app.bypass_rls', true) = 'on'
    );

-- Leads Policy
CREATE POLICY workspace_isolation_leads ON leads
    USING (
        workspace_id = current_setting('app.current_workspace_id', true)
        OR current_setting('app.bypass_rls', true) = 'on'
    );

-- Email Events Policy
CREATE POLICY workspace_isolation_email_events ON email_events
    USING (
        workspace_id = current_setting('app.current_workspace_id', true)
        OR current_setting('app.bypass_rls', true) = 'on'
    );

-- Search Events Policy
CREATE POLICY workspace_isolation_search_events ON search_events
    USING (
        workspace_id = current_setting('app.current_workspace_id', true)
        OR current_setting('app.bypass_rls', true) = 'on'
    );

