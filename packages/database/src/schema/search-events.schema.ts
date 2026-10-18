import { pgTable, text, varchar, integer, timestamp, uuid, index } from 'drizzle-orm/pg-core';
import { workspaces } from './workspaces.schema.js';

export const searchEvents = pgTable('search_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  location: varchar('location', { length: 255 }).notNull(),
  scheduleCron: varchar('schedule_cron', { length: 50 }).notNull().default('0 9 * * *'),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  queryPrompt: text('query_prompt'),
  totalLeadsFound: integer('total_leads_found').notNull().default(0),
  lastRunAt: timestamp('last_run_at', { withTimezone: true }),
  nextRunAt: timestamp('next_run_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  workspaceIdIdx: index('idx_search_events_workspace_id').on(table.workspaceId),
  statusIdx: index('idx_search_events_status').on(table.status),
}));
