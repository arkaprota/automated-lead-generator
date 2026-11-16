import { z } from 'zod';

export const brochurePitchSchema = z.object({
  headline: z.string(),
  painPoints: z.array(z.string()).min(1),
  tailoredSolution: z.string(),
  estimatedRoi: z.string(),
  callToAction: z.string(),
});

export type BrochurePitchOutput = z.infer<typeof brochurePitchSchema>;
