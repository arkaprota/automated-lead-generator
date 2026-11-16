import { z } from 'zod';

export const queryExpansionSchema = z.object({
  queries: z.array(z.string().min(1)).min(1).max(10),
  rationale: z.string().optional().default(''),
});

export type QueryExpansionOutput = z.infer<typeof queryExpansionSchema>;
