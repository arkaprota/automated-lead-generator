import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import type { Request } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';

/** Per-IP ceiling across the whole API. */
export const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

/** Per-workspace ceiling on paid LLM / scraping endpoints. Must run after tenantMiddleware. */
export const aiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) =>
    (req as AuthenticatedRequest).workspaceId ?? ipKeyGenerator(req.ip ?? ''),
  message: { success: false, error: 'Too many AI requests, please slow down' },
});
