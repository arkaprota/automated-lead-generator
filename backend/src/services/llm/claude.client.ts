import { getAnthropicClient } from '../../config/anthropic.js';
import { env } from '../../config/env.js';
import type { LlmClient } from '../../types/index.js';
import type { LlmJsonTask } from '../../types/llm-json-task.interface.js';

export class ClaudeClient implements LlmClient {
  isConfigured(): boolean {
    return Boolean(env.ANTHROPIC_API_KEY);
  }

  async generateJson<T>(task: LlmJsonTask<T>): Promise<T | null> {
    try {
      const client = getAnthropicClient();

      const response = await client.messages.create({
        model: env.CLAUDE_MODEL,
        max_tokens: task.maxOutputTokens,
        // Lowest effort for extraction/classification — Rule 12
        output_config: { effort: 'low' },
        system: 'You are a precise JSON data extractor. Return ONLY valid JSON matching the requested schema. No commentary, no markdown fences.',
        messages: [{ role: 'user', content: task.prompt }],
      });

      const textBlock = response.content.find((b) => b.type === 'text');
      if (!textBlock || textBlock.type !== 'text') {
        console.warn(`[ClaudeClient] No text block in response for task "${task.name}"`);
        return null;
      }

      // Log token usage per Rule 12
      console.log(`[ClaudeClient] task="${task.name}" in=${response.usage.input_tokens} out=${response.usage.output_tokens}`);

      const parsed: unknown = JSON.parse(textBlock.text);
      const result = task.zodSchema.safeParse(parsed);

      if (!result.success) {
        console.warn(`[ClaudeClient] Schema validation failed for task "${task.name}":`, result.error.errors);
        return null;
      }

      return result.data;
    } catch (error) {
      console.warn(`[ClaudeClient] Task "${task.name}" failed:`, error);
      return null;
    }
  }
}
