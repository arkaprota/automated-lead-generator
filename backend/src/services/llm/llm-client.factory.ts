import { LlmProvider } from '../../enums/llm-provider.enum.js';
import { env } from '../../config/env.js';
import { GeminiClient } from './gemini.client.js';
import { ClaudeClient } from './claude.client.js';
import { OpenAiClient } from './openai.client.js';
import type { LlmClient } from '../../types/index.js';

// Lazy singletons — one instance per provider for the lifetime of the process
const clients: Partial<Record<LlmProvider, LlmClient>> = {};

/**
 * Returns the LlmClient for the given provider.
 * Falls back to the env default when provider is undefined.
 */
export function getLlmClient(provider?: LlmProvider | string | null): LlmClient {
  const resolved = (provider as LlmProvider) || env.LLM_PROVIDER || LlmProvider.GEMINI;

  if (!clients[resolved]) {
    switch (resolved) {
      case LlmProvider.CLAUDE:
        clients[resolved] = new ClaudeClient();
        break;
      case LlmProvider.OPENAI:
        clients[resolved] = new OpenAiClient();
        break;
      case LlmProvider.GEMINI:
      default:
        clients[resolved] = new GeminiClient();
        break;
    }
  }

  return clients[resolved]!;
}

/**
 * Returns which providers are configured (have an API key) on this server.
 */
export function getConfiguredProviders(): { id: LlmProvider; label: string; configured: boolean }[] {
  return [
    { id: LlmProvider.GEMINI, label: 'Google Gemini', configured: Boolean(env.GEMINI_API_KEY) },
    { id: LlmProvider.CLAUDE, label: 'Anthropic Claude', configured: Boolean(env.ANTHROPIC_API_KEY) },
    { id: LlmProvider.OPENAI, label: 'OpenAI ChatGPT', configured: Boolean(env.OPENAI_API_KEY) },
  ];
}
