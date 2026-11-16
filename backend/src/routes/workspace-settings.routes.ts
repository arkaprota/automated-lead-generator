import { Router, type Response } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';
import { validateBody } from '../middleware/validator.middleware.js';
import { aiProviderSettingsSchema } from '../schemas/ai-provider-settings.schema.js';
import { WorkspaceAiProviderService } from '../services/workspace-ai-provider.service.js';
import { getConfiguredProviders } from '../services/llm/llm-client.factory.js';
import { LlmProvider } from '../enums/llm-provider.enum.js';

const router = Router();

/**
 * GET /api/workspace/ai-provider
 * Returns the workspace's current AI provider and which providers are server-configured.
 */
router.get('/ai-provider', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const workspaceId = req.workspaceId!;
    const provider = await WorkspaceAiProviderService.getProvider(workspaceId);
    res.json({
      success: true,
      data: {
        provider,
        availableProviders: getConfiguredProviders(),
      },
    });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to retrieve AI provider setting' });
  }
});

/**
 * PATCH /api/workspace/ai-provider
 * Updates the workspace's chosen AI provider.
 */
router.patch(
  '/ai-provider',
  validateBody(aiProviderSettingsSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const workspaceId = req.workspaceId!;
      const { provider } = req.body as { provider: LlmProvider };
      await WorkspaceAiProviderService.setProvider(workspaceId, provider);
      res.json({ success: true, data: { provider } });
    } catch {
      res.status(500).json({ success: false, error: 'Failed to update AI provider setting' });
    }
  }
);

export default router;
