import { pgTable, text, varchar, integer, boolean, timestamp, uuid, jsonb, index } from 'drizzle-orm/pg-core';
import { workspaces } from './workspaces.schema.js';
import { leads } from './leads.schema.js';

export const autopilotRules = pgTable('autopilot_rules', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  triggerType: varchar('trigger_type', { length: 100 }).notNull(),
  delayMinutes: integer('delay_minutes').notNull().default(2880),
  requiresReview: boolean('requires_review').notNull().default(true),
  enabled: boolean('enabled').notNull().default(true),
  config: jsonb('config').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  workspaceIdIdx: index('idx_autopilot_rules_workspace_id').on(table.workspaceId),
}));

export const autopilotExecutions = pgTable('autopilot_executions', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  ruleId: uuid('rule_id').notNull().references(() => autopilotRules.id, { onDelete: 'cascade' }),
  leadId: uuid('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 50 }).notNull().default('queued'),
  actionPayload: jsonb('action_payload').notNull().default({}),
  executedAt: timestamp('executed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  workspaceIdIdx: index('idx_autopilot_executions_workspace_id').on(table.workspaceId),
  ruleIdIdx: index('idx_autopilot_executions_rule_id').on(table.ruleId),
  leadIdIdx: index('idx_autopilot_executions_lead_id').on(table.leadId),
}));
