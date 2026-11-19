import { getGeminiClient } from '../../config/gemini.js';
import { env } from '../../config/env.js';
import type { LlmClient } from '../../types/index.js';
import type { LlmJsonTask } from '../../types/llm-json-task.interface.js';

export class GeminiClient implements LlmClient {
  isConfigured(): boolean {
    return Boolean(env.GEMINI_API_KEY);
  }

  async generateJson<T>(task: LlmJsonTask<T>): Promise<T | null> {
    try {
      const client = getGeminiClient();
      const response = await client.models.generateContent({
        model: env.GEMINI_MODEL,
        contents: task.prompt,
        config: {
          responseMimeType: 'application/json',
          maxOutputTokens: task.maxOutputTokens,
        },
      });

      const raw = response.text || '{}';
      const parsed: unknown = JSON.parse(raw);
      const result = task.zodSchema.safeParse(parsed);

      if (!result.success) {
        console.warn(`[GeminiClient] Schema validation failed for task "${task.name}":`, result.error.issues);
        return null;
      }

      return result.data;
    } catch (error) {
      console.warn(`[GeminiClient] Task "${task.name}" failed:`, error);
      return null;
    }
  }
}
