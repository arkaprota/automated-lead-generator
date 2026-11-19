import type { Request, Response, NextFunction } from 'express';
import { IntegrationNotConfiguredError } from '../errors/integration-not-configured.error.js';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[Error Handler]:', err);

  const status = (err as { status?: number }).status || 500;
  // Never echo internal error text (DB / SDK messages) to clients on server errors
  const safeToShow = status < 500 || err instanceof IntegrationNotConfiguredError;
  const message = safeToShow ? err.message || 'Request failed' : 'Internal Server Error';

  res.status(status).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
}
