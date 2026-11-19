import OpenAI from 'openai';
import { env } from './env.js';
import { IntegrationNotConfiguredError } from '../errors/integration-not-configured.error.js';

let openaiClient: OpenAI | null = null;

export function getOpenAiClient(): OpenAI {
  if (!env.OPENAI_API_KEY) throw new IntegrationNotConfiguredError('ai');
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}
