import { Router, type Response } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';
import { ProfileService } from '../services/profile.service.js';
import { respondWithError } from '../utils/respond-with-error.util.js';

const router = Router();

/**
 * GET /api/me
 * Signed-in user + active workspace (plan, credits, role, AI provider) from our database.
 */
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await ProfileService.getProfile(req.userId!, req.workspaceId!);
    res.json({ success: true, data });
  } catch (error) {
    console.error('[MeRouter] Error loading profile:', error);
    respondWithError(res, error, 'Failed to load profile');
  }
});

export default router;
