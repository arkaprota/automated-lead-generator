import Anthropic from '@anthropic-ai/sdk';
import { env } from './env.js';
import { IntegrationNotConfiguredError } from '../errors/integration-not-configured.error.js';

let anthropicClient: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!env.ANTHROPIC_API_KEY) throw new IntegrationNotConfiguredError('ai');
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
}
