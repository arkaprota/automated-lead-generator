import { z } from 'zod';
import { EventStatus } from '../enums/event-status.enum.js';

export const CreateSearchEventSchema = z.object({
  name: z.string().min(2, 'Event name must be at least 2 characters'),
  category: z.string().min(2, 'Category must be at least 2 characters'),
  location: z.string().min(2, 'Location must be at least 2 characters'),
  scheduleCron: z.string().default('0 9 * * *'), // Default everyday at 9 AM
  status: z.nativeEnum(EventStatus).default(EventStatus.ACTIVE),
  queryPrompt: z.string().optional()
});

export const UpdateSearchEventSchema = CreateSearchEventSchema.partial();

export const SearchEventFilterSchema = z.object({
  status: z.nativeEnum(EventStatus).optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20)
});

export type CreateSearchEventInput = z.infer<typeof CreateSearchEventSchema>;
export type UpdateSearchEventInput = z.infer<typeof UpdateSearchEventSchema>;
export type SearchEventFilter = z.infer<typeof SearchEventFilterSchema>;
