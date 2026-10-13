import { pgTable, text, varchar, integer, boolean, timestamp, uuid, jsonb, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ==============================================================================
// 1. TENANTS & USERS
// ==============================================================================

export const workspaces = pgTable('workspaces', {
  id: text('id').primaryKey(), // Clerk Organization ID (e.g., 'org_xxx')
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).unique(),
  ownerUserId: text('owner_user_id').notNull(),
  plan: varchar('plan', { length: 50 }).notNull().default('starter'),
  creditsRemaining: integer('credits_remaining').notNull().default(500),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable('users', {
  id: text('id').primaryKey(), // Clerk User ID (e.g., 'user_xxx')
  email: varchar('email', { length: 255 }).notNull().unique(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const workspaceMembers = pgTable('workspace_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 50 }).notNull().default('member'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ==============================================================================
// 2. SENDER PROFILES
// ==============================================================================

export const senderProfiles = pgTable('sender_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  senderName: varchar('sender_name', { length: 255 }).notNull(),
  senderEmail: varchar('sender_email', { length: 255 }).notNull(),
  pitchAngle: text('pitch_angle'),
  companyDescription: text('company_description'),
  logoUrl: text('logo_url'),
  websiteUrl: text('website_url'),
  phone: varchar('phone', { length: 50 }),
  nylasGrantId: text('nylas_grant_id'),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ==============================================================================
// 3. CAMPAIGNS
// ==============================================================================

export const campaigns = pgTable('campaigns', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  senderProfileId: uuid('sender_profile_id').references(() => senderProfiles.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull(),
  targetDemographic: text('target_demographic').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('draft'),
  dailyLimit: integer('daily_limit').notNull().default(50),
  emailSubjectTemplate: text('email_subject_template'),
  emailBodyTemplate: text('email_body_template'),
  scheduleConfig: jsonb('schedule_config').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ==============================================================================
// 4. LEADS
// ==============================================================================

export const leads = pgTable('leads', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  campaignId: uuid('campaign_id').references(() => campaigns.id, { onDelete: 'set null' }),
  businessName: varchar('business_name', { length: 255 }).notNull(),
  contactName: varchar('contact_name', { length: 255 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 100 }),
  website: text('website'),
  address: text('address'),
  googlePlaceId: varchar('google_place_id', { length: 255 }),
  leadScore: integer('lead_score').notNull().default(0),
  qualificationStatus: varchar('qualification_status', { length: 50 }).notNull().default('unqualified'),
  qualificationReasons: jsonb('qualification_reasons').notNull().default([]),
  rawMetadata: jsonb('raw_metadata').notNull().default({}),
  pdfBrochureUrl: text('pdf_brochure_url'),
  brochurePitchData: jsonb('brochure_pitch_data'),
  brochureGeneratedAt: timestamp('brochure_generated_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  workspacePlaceIdIdx: uniqueIndex('idx_leads_workspace_place_id').on(table.workspaceId, table.googlePlaceId),
  workspaceWebsiteIdx: uniqueIndex('idx_leads_workspace_website').on(table.workspaceId, table.website),
  workspaceEmailIdx: uniqueIndex('idx_leads_workspace_email').on(table.workspaceId, table.email),
  workspaceIdIdx: index('idx_leads_workspace_id').on(table.workspaceId),
  campaignIdIdx: index('idx_leads_campaign_id').on(table.campaignId),
  leadScoreIdx: index('idx_leads_lead_score').on(table.leadScore),
  qualificationStatusIdx: index('idx_leads_qualification_status').on(table.qualificationStatus),
}));

// ==============================================================================
// 5. EMAIL EVENTS & WEBHOOK RESPONSES
// ==============================================================================

export const emailEvents = pgTable('email_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  campaignId: uuid('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  leadId: uuid('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
  messageId: varchar('message_id', { length: 255 }),
  eventType: varchar('event_type', { length: 50 }).notNull(),
  replyIntent: varchar('reply_intent', { length: 50 }),
  replyBody: text('reply_body'),
  replySnippet: text('reply_snippet'),
  pdfUrlIncluded: text('pdf_url_included'),
  rawPayload: jsonb('raw_payload').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  workspaceIdIdx: index('idx_email_events_workspace_id').on(table.workspaceId),
  campaignIdIdx: index('idx_email_events_campaign_id').on(table.campaignId),
  leadIdIdx: index('idx_email_events_lead_id').on(table.leadId),
  eventTypeIdx: index('idx_email_events_event_type').on(table.eventType),
  replyIntentIdx: index('idx_email_events_reply_intent').on(table.replyIntent),
}));

// ==============================================================================
// RELATIONS
// ==============================================================================

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  members: many(workspaceMembers),
  senderProfiles: many(senderProfiles),
  campaigns: many(campaigns),
  leads: many(leads),
  emailEvents: many(emailEvents),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [campaigns.workspaceId], references: [workspaces.id] }),
  senderProfile: one(senderProfiles, { fields: [campaigns.senderProfileId], references: [senderProfiles.id] }),
  leads: many(leads),
  emailEvents: many(emailEvents),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [leads.workspaceId], references: [workspaces.id] }),
  campaign: one(campaigns, { fields: [leads.campaignId], references: [campaigns.id] }),
  emailEvents: many(emailEvents),
}));

export const emailEventsRelations = relations(emailEvents, ({ one }) => ({
  workspace: one(workspaces, { fields: [emailEvents.workspaceId], references: [workspaces.id] }),
  campaign: one(campaigns, { fields: [emailEvents.campaignId], references: [campaigns.id] }),
  lead: one(leads, { fields: [emailEvents.leadId], references: [leads.id] }),
}));
