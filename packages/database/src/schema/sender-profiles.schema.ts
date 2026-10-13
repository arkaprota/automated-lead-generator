import { pgTable, text, varchar, boolean, timestamp, uuid } from 'drizzle-orm/pg-core';
import { workspaces } from './workspaces.schema.js';

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
