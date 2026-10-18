import { pgTable, text, varchar, integer, timestamp, uuid, jsonb, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { workspaces } from './workspaces.schema.js';
import { campaigns } from './campaigns.schema.js';
import { searchEvents } from './search-events.schema.js';

export const leads = pgTable('leads', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  campaignId: uuid('campaign_id').references(() => campaigns.id, { onDelete: 'set null' }),
  eventId: uuid('event_id').references(() => searchEvents.id, { onDelete: 'set null' }),
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
  eventIdIdx: index('idx_leads_event_id').on(table.eventId),
  leadScoreIdx: index('idx_leads_lead_score').on(table.leadScore),
  qualificationStatusIdx: index('idx_leads_qualification_status').on(table.qualificationStatus),
}));
