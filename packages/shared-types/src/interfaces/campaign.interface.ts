import { CampaignStatus } from '../enums/campaign-status.enum.js';

export interface ICampaign {
  id: string;
  workspaceId: string;
  name: string;
  status: CampaignStatus;
  subjectTemplate: string;
  bodyTemplate: string;
  dailyLimit: number;
  sendWindowStart: string;
  sendWindowEnd: string;
  senderProfileId: string;
  createdAt: Date;
  updatedAt: Date;
}
