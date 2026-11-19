import type { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[Error Handler]:', err);

  const status = (err as { status?: number }).status || 500;
  // Never echo internal error text (DB / SDK messages) to clients on server errors
  const message = status >= 500 ? 'Internal Server Error' : err.message || 'Request failed';

  res.status(status).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
}
