import { z } from 'zod';
import { CampaignStatus } from '../enums/campaign-status.enum.js';

export const CampaignCreateSchema = z.object({
  name: z.string().min(2, 'Campaign name must be at least 2 characters'),
  subjectTemplate: z.string().min(3, 'Subject line template is required'),
  bodyTemplate: z.string().min(10, 'Body template is required'),
  dailyLimit: z.number().int().min(1).max(200).default(50),
  sendWindowStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).default('09:00'),
  sendWindowEnd: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).default('18:00'),
  senderProfileId: z.string().uuid()
});

export const CampaignUpdateSchema = CampaignCreateSchema.partial().extend({
  status: z.nativeEnum(CampaignStatus).optional()
});

export type CampaignCreateInput = z.infer<typeof CampaignCreateSchema>;
export type CampaignUpdateInput = z.infer<typeof CampaignUpdateSchema>;
