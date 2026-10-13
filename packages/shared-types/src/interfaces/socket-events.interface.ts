import { ILead } from './lead.interface.js';
import { ReplyIntent } from '../enums/reply-intent.enum.js';

export interface PositiveReplyPayload {
  leadId: string;
  businessName: string;
  leadEmail?: string;
  replySnippet: string;
  intent: ReplyIntent;
  receivedAt: string;
}

export interface LeadScoredPayload {
  lead: ILead;
  workspaceId: string;
}

export interface ServerToClientEvents {
  'lead:positive_reply': (data: PositiveReplyPayload) => void;
  'lead:scored': (data: LeadScoredPayload) => void;
  'campaign:progress': (data: { campaignId: string; sentCount: number; totalCount: number }) => void;
  'autopilot:action_queued': (data: { ruleName: string; leadName: string; actionType: string }) => void;
}

export interface ClientToServerEvents {
  'subscribe:workspace': (workspaceId: string) => void;
  'unsubscribe:workspace': (workspaceId: string) => void;
}
