import { getRedisClient } from '../../config/redis.js';

const CACHE_TTL_SECONDS = 24 * 60 * 60; // 24 hours (Rule 12 — cache repeat work)

/**
 * Caches identical LLM inputs per workspace for 24 hours.
 * Used for query expansion which re-runs the same demographic daily.
 */
export class LlmCacheService {
  private static buildKey(
    workspaceId: string,
    provider: string,
    task: string,
    input: string
  ): string {
    // Deterministic key: provider:task:workspace:hash-of-input
    const inputHash = Buffer.from(input).toString('base64').slice(0, 32);
    return `llm_cache:${provider}:${task}:${workspaceId}:${inputHash}`;
  }

  /** Maximum ms to wait for a Redis call before giving up (non-fatal). */
  private static readonly TIMEOUT_MS = 400;

  private static withTimeout<T>(promise: Promise<T>): Promise<T | null> {
    return Promise.race([
      promise,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), LlmCacheService.TIMEOUT_MS)),
    ]);
  }

  static async get<T>(
    workspaceId: string,
    provider: string,
    task: string,
    input: string
  ): Promise<T | null> {
    try {
      const redis = getRedisClient();
      const cached = await LlmCacheService.withTimeout(
        redis.get(LlmCacheService.buildKey(workspaceId, provider, task, input))
      );
      if (!cached) return null;
      return JSON.parse(cached) as T;
    } catch {
      return null;
    }
  }

  static async set<T>(
    workspaceId: string,
    provider: string,
    task: string,
    input: string,
    value: T
  ): Promise<void> {
    try {
      const redis = getRedisClient();
      await LlmCacheService.withTimeout(
        redis.set(
          LlmCacheService.buildKey(workspaceId, provider, task, input),
          JSON.stringify(value),
          'EX',
          CACHE_TTL_SECONDS
        )
      );
    } catch {
      // Cache write failure is non-fatal
    }
  }
}
