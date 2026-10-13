import { z } from 'zod';

export const AutopilotTriggerSchema = z.enum([
  'EMAIL_OPENED_NO_REPLY',
  'REPLY_RECEIVED_QUESTION',
  'REPLY_RECEIVED_NEGATIVE',
  'STALE_HIGH_SCORE_LEAD'
]);

export const AutopilotRuleSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2),
  triggerType: AutopilotTriggerSchema,
  delayMinutes: z.number().int().min(0).default(2880), // 48 hours default
  requiresReview: z.boolean().default(true),
  enabled: z.boolean().default(true)
});

export type AutopilotTrigger = z.infer<typeof AutopilotTriggerSchema>;
export type AutopilotRule = z.infer<typeof AutopilotRuleSchema>;
