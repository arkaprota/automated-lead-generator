import { pgTable, text, varchar, timestamp, uuid, jsonb, index } from 'drizzle-orm/pg-core';
import { workspaces } from './workspaces.schema.js';
import { campaigns } from './campaigns.schema.js';
import { leads } from './leads.schema.js';

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
