import { relations } from 'drizzle-orm';
import { workspaces } from './workspaces.schema.js';
import { users, workspaceMembers } from './users.schema.js';
import { senderProfiles } from './sender-profiles.schema.js';
import { campaigns } from './campaigns.schema.js';
import { leads } from './leads.schema.js';
import { searchEvents } from './search-events.schema.js';
import { emailEvents } from './email-events.schema.js';
import { aiConversations, aiMessages } from './ai-chat.schema.js';
import { autopilotRules, autopilotExecutions } from './autopilot.schema.js';

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  members: many(workspaceMembers),
  senderProfiles: many(senderProfiles),
  campaigns: many(campaigns),
  leads: many(leads),
  searchEvents: many(searchEvents),
  emailEvents: many(emailEvents),
  conversations: many(aiConversations),
  autopilotRules: many(autopilotRules),
}));

export const searchEventsRelations = relations(searchEvents, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [searchEvents.workspaceId], references: [workspaces.id] }),
  leads: many(leads),
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
  searchEvent: one(searchEvents, { fields: [leads.eventId], references: [searchEvents.id] }),
  emailEvents: many(emailEvents),
  autopilotExecutions: many(autopilotExecutions),
}));

export const emailEventsRelations = relations(emailEvents, ({ one }) => ({
  workspace: one(workspaces, { fields: [emailEvents.workspaceId], references: [workspaces.id] }),
  campaign: one(campaigns, { fields: [emailEvents.campaignId], references: [campaigns.id] }),
  lead: one(leads, { fields: [emailEvents.leadId], references: [leads.id] }),
}));

export const aiConversationsRelations = relations(aiConversations, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [aiConversations.workspaceId], references: [workspaces.id] }),
  user: one(users, { fields: [aiConversations.userId], references: [users.id] }),
  messages: many(aiMessages),
}));

export const aiMessagesRelations = relations(aiMessages, ({ one }) => ({
  conversation: one(aiConversations, { fields: [aiMessages.conversationId], references: [aiConversations.id] }),
  workspace: one(workspaces, { fields: [aiMessages.workspaceId], references: [workspaces.id] }),
}));

export const autopilotRulesRelations = relations(autopilotRules, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [autopilotRules.workspaceId], references: [workspaces.id] }),
  executions: many(autopilotExecutions),
}));

export const autopilotExecutionsRelations = relations(autopilotExecutions, ({ one }) => ({
  rule: one(autopilotRules, { fields: [autopilotExecutions.ruleId], references: [autopilotRules.id] }),
  lead: one(leads, { fields: [autopilotExecutions.leadId], references: [leads.id] }),
  workspace: one(workspaces, { fields: [autopilotExecutions.workspaceId], references: [workspaces.id] }),
}));
