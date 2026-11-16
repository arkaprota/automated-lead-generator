import OpenAI from 'openai';
import { env } from './env.js';

let openaiClient: OpenAI | null = null;

export function getOpenAiClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: env.OPENAI_API_KEY || 'dummy-dev-key',
    });
  }
  return openaiClient;
}
