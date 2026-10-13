import { pgTable, text, varchar, integer, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';
import { workspaces } from './workspaces.schema.js';
import { senderProfiles } from './sender-profiles.schema.js';

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
