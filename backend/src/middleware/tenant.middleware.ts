import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';
import { isAuthBypassed } from '../config/env.js';
import { verifyClerkToken, extractBearerToken } from '../utils/verify-clerk-token.util.js';

export const DEV_WORKSPACE_ID = 'ws_dev_default';
const DEV_USER_ID = 'user_dev_default';

/**
 * Authenticates the Clerk session token and derives the tenant from its active organization.
 * Client-supplied workspace headers are never trusted.
 */
export async function tenantMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (isAuthBypassed) {
    req.workspaceId = DEV_WORKSPACE_ID;
    req.userId = DEV_USER_ID;
    next();
    return;
  }

  const token = extractBearerToken(req.headers.authorization);
  const identity = token ? await verifyClerkToken(token) : null;

  if (!identity) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }
  if (!identity.workspaceId) {
    res.status(403).json({ success: false, error: 'No active organization selected' });
    return;
  }

  req.workspaceId = identity.workspaceId;
  req.userId = identity.userId;
  next();
}
