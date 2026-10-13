import { pgTable, text, varchar, integer, timestamp } from 'drizzle-orm/pg-core';

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
