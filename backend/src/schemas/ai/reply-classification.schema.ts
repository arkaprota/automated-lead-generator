import { z } from 'zod';
import { ReplyIntent } from '../../enums/reply-intent.enum.js';

export const replyClassificationSchema = z.object({
  intent: z.nativeEnum(ReplyIntent),
  confidence: z.number().min(0).max(1),
  summary: z.string(),
  suggestedAction: z.string(),
});

export type ReplyClassificationOutput = z.infer<typeof replyClassificationSchema>;
