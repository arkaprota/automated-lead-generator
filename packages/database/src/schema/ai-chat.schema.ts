import { pgTable, text, varchar, timestamp, uuid, jsonb, index } from 'drizzle-orm/pg-core';
import { workspaces } from './workspaces.schema.js';
import { users } from './users.schema.js';

export const aiConversations = pgTable('ai_conversations', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull().default('New Chat Session'),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  workspaceIdIdx: index('idx_ai_conversations_workspace_id').on(table.workspaceId),
}));

export const aiMessages = pgTable('ai_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversationId: uuid('conversation_id').notNull().references(() => aiConversations.id, { onDelete: 'cascade' }),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 50 }).notNull(), // 'user' | 'assistant' | 'function_call' | 'function_result'
  content: text('content').notNull(),
  functionCall: jsonb('function_call'),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  conversationIdIdx: index('idx_ai_messages_conversation_id').on(table.conversationId),
  workspaceIdIdx: index('idx_ai_messages_workspace_id').on(table.workspaceId),
}));
