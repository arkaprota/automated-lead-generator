import { getOpenAiClient } from '../../config/openai.js';
import { env } from '../../config/env.js';
import type { LlmClient } from '../../types/index.js';
import type { LlmJsonTask } from '../../types/llm-json-task.interface.js';
import { zodResponseFormat } from 'openai/helpers/zod';

export class OpenAiClient implements LlmClient {
  isConfigured(): boolean {
    return Boolean(env.OPENAI_API_KEY);
  }

  async generateJson<T>(task: LlmJsonTask<T>): Promise<T | null> {
    try {
      const client = getOpenAiClient();

      const completion = await client.chat.completions.parse({
        model: env.OPENAI_MODEL,
        max_tokens: task.maxOutputTokens,
        messages: [
          {
            role: 'system',
            content: 'You are a precise JSON data extractor. Return ONLY valid JSON matching the requested schema.',
          },
          { role: 'user', content: task.prompt },
        ],
        response_format: zodResponseFormat(task.zodSchema, task.name),
      });

      const message = completion.choices[0]?.message;
      if (!message) {
        console.warn(`[OpenAiClient] Empty response for task "${task.name}"`);
        return null;
      }

      // Log token usage per Rule 12
      console.log(`[OpenAiClient] task="${task.name}" in=${completion.usage?.prompt_tokens ?? 0} out=${completion.usage?.completion_tokens ?? 0}`);

      if (message.refusal) {
        console.warn(`[OpenAiClient] Refusal for task "${task.name}": ${message.refusal}`);
        return null;
      }

      return message.parsed as T ?? null;
    } catch (error) {
      console.warn(`[OpenAiClient] Task "${task.name}" failed:`, error);
      return null;
    }
  }
}
