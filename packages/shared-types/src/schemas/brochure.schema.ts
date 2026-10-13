import { z } from 'zod';

export const DynamicPitchSchema = z.object({
  headline: z.string().min(5),
  painPoints: z.array(z.string()).min(1).max(5),
  tailoredSolution: z.string().min(10),
  estimatedRoi: z.string().min(3),
  callToAction: z.string().min(5)
});

export const GenerateBrochureInputSchema = z.object({
  leadId: z.string().uuid(),
  templateTheme: z.enum(['modern-dark', 'clean-light', 'bold-gradient']).default('modern-dark')
});

export type DynamicPitch = z.infer<typeof DynamicPitchSchema>;
export type GenerateBrochureInput = z.infer<typeof GenerateBrochureInputSchema>;
