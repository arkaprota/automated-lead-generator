import type { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  workspaceId?: string;
  userId?: string;
  userRole?: string;
}
