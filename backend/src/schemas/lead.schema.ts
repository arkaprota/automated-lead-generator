import { z } from 'zod';
import { LeadStatus } from '../enums/lead-status.enum.js';

export const RawLeadSchema = z.object({
  name: z.string().min(1, 'Business name is required'),
  placeId: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  website: z.string().url().optional().nullable(),
  rating: z.number().min(0).max(5).optional().nullable(),
  reviewCount: z.number().int().min(0).optional().nullable(),
  category: z.string().optional().nullable()
});

export const ScoredLeadResultSchema = z.object({
  leadScore: z.number().int().min(0).max(100),
  status: z.nativeEnum(LeadStatus),
  qualificationReasons: z.array(z.string()),
  recommendedPitchAngle: z.string()
});

export const GenerateLeadsInputSchema = z.object({
  demographic: z.string().min(3, 'Demographic search query must be at least 3 characters'),
  limit: z.number().int().min(1).max(50).default(10)
});

export const LeadFilterSchema = z.object({
  status: z.nativeEnum(LeadStatus).optional(),
  minScore: z.number().int().min(0).max(100).optional(),
  hasWebsite: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20)
});

export type RawLead = z.infer<typeof RawLeadSchema>;
export type ScoredLeadResult = z.infer<typeof ScoredLeadResultSchema>;
export type GenerateLeadsInput = z.infer<typeof GenerateLeadsInputSchema>;
export type LeadFilter = z.infer<typeof LeadFilterSchema>;
