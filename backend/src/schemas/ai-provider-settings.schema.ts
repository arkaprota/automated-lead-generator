import { z } from 'zod';

export const aiProviderSettingsSchema = z.object({
  provider: z.enum(['gemini', 'claude', 'openai']),
});
