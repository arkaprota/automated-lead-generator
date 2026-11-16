import { z } from 'zod';

export const replyClassificationSchema = z.object({
  intent: z.enum(['INTERESTED', 'NOT_INTERESTED', 'QUESTION', 'NEUTRAL']),
  confidence: z.number().min(0).max(1),
  summary: z.string(),
  suggestedAction: z.string(),
});

export type ReplyClassificationOutput = z.infer<typeof replyClassificationSchema>;
