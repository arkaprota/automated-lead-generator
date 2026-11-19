import type { Response } from 'express';
import { IntegrationNotConfiguredError } from '../errors/integration-not-configured.error.js';

/** 503 with an honest message for missing integrations; generic 500 (no internals leaked) otherwise. */
export function respondWithError(res: Response, error: unknown, fallbackMessage: string): void {
  if (error instanceof IntegrationNotConfiguredError) {
    res.status(503).json({ success: false, error: error.message, integration: error.integration });
    return;
  }
  res.status(500).json({ success: false, error: fallbackMessage });
}
