import { z } from 'zod';

export const leadScoringSchema = z.object({
  leadScore: z.number().int().min(0).max(100),
  qualificationStatus: z.enum(['hot', 'warm', 'cold', 'disqualified']),
  reasons: z.array(z.string()),
  keyStrengths: z.array(z.string()),
  recommendedPitchAngle: z.string(),
});

export type LeadScoringOutput = z.infer<typeof leadScoringSchema>;
