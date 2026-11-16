import Anthropic from '@anthropic-ai/sdk';
import { env } from './env.js';

let anthropicClient: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: env.ANTHROPIC_API_KEY || 'dummy-dev-key',
    });
  }
  return anthropicClient;
}
