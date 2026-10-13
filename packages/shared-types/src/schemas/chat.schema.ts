import { z } from 'zod';

export const ChatRoleSchema = z.enum(['user', 'assistant', 'system', 'function_call', 'function_result']);

export const ChatMessageInputSchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().min(1, 'Message cannot be empty'),
  contextPayload: z.record(z.unknown()).optional()
});

export const ActionConfirmationSchema = z.object({
  actionId: z.string().uuid(),
  actionName: z.string(),
  parameters: z.record(z.unknown()),
  confirmed: z.boolean()
});

export type ChatRole = z.infer<typeof ChatRoleSchema>;
export type ChatMessageInput = z.infer<typeof ChatMessageInputSchema>;
export type ActionConfirmation = z.infer<typeof ActionConfirmationSchema>;
