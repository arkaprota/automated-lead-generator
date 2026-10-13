import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';

/**
 * Tenant Isolation Middleware
 * Resolves the active workspace_id for the current tenant from:
 * 1. `x-workspace-id` HTTP header (typically passed from Next.js Clerk active Org)
 * 2. Clerk Authorization JWT claims (when configured)
 * 3. Fallback dev workspace header
 */
export function tenantMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const workspaceIdHeader = req.headers['x-workspace-id'] || req.headers['x-tenant-id'];
  const userIdHeader = req.headers['x-user-id'];

  const resolvedWorkspaceId = Array.isArray(workspaceIdHeader)
    ? workspaceIdHeader[0]
    : workspaceIdHeader;

  const resolvedUserId = Array.isArray(userIdHeader)
    ? userIdHeader[0]
    : userIdHeader;

  // In production, require strict workspace resolution
  if (!resolvedWorkspaceId && process.env.NODE_ENV === 'production') {
    res.status(401).json({
      success: false,
      error: 'Unauthorized: Missing required Workspace Context (x-workspace-id header)',
    });
    return;
  }

  // Development fallback for local testing
  req.workspaceId = resolvedWorkspaceId || 'ws_dev_default';
  req.userId = resolvedUserId || 'user_dev_default';

  next();
}
