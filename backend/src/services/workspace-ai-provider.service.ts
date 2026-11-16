import { withTenantContext } from '../config/db.js';
import { workspaces } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { LlmProvider } from '../enums/llm-provider.enum.js';
import { env } from '../config/env.js';

/** In-process cache to avoid a DB round-trip on every AI call within the same request */
const runtimeCache = new Map<string, LlmProvider>();

export class WorkspaceAiProviderService {
  /**
   * Returns the AI provider chosen by this workspace.
   * Falls back to the LLM_PROVIDER env var, then to 'gemini'.
   */
  static async getProvider(workspaceId: string): Promise<LlmProvider> {
    if (runtimeCache.has(workspaceId)) {
      return runtimeCache.get(workspaceId)!;
    }

    try {
      const [ws] = await withTenantContext(workspaceId, async (db) =>
        db.select({ aiProvider: workspaces.aiProvider }).from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1)
      );
      const rawProvider = ws?.aiProvider;
      const provider: LlmProvider =
        (Object.values(LlmProvider) as string[]).includes(rawProvider ?? '')
          ? (rawProvider as LlmProvider)
          : (env.LLM_PROVIDER as LlmProvider) || LlmProvider.GEMINI;
      runtimeCache.set(workspaceId, provider);
      return provider;
    } catch {
      return (env.LLM_PROVIDER as LlmProvider) || LlmProvider.GEMINI;
    }
  }

  /**
   * Updates the workspace's chosen AI provider and invalidates the runtime cache.
   */
  static async setProvider(workspaceId: string, provider: LlmProvider): Promise<void> {
    await withTenantContext(workspaceId, async (db) =>
      db.update(workspaces).set({ aiProvider: provider }).where(eq(workspaces.id, workspaceId))
    );
    runtimeCache.set(workspaceId, provider);
  }

  /** Clears the in-process cache (useful in tests) */
  static clearCache(): void {
    runtimeCache.clear();
  }
}
