import type { ReplyIntent } from '../enums/reply-intent.enum.js';

export interface ReplyClassificationResponse {
  intent: ReplyIntent;
  confidence: number;
  summary: string;
  suggestedAction: string;
}
