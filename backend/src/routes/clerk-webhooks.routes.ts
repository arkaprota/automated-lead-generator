import { Router, type Request, type Response } from 'express';
import { verifyWebhook } from '@clerk/backend/webhooks';
import type { WebhookEvent } from '@clerk/backend/webhooks';
import { env } from '../config/env.js';
import { ClerkSyncService } from '../services/clerk-sync.service.js';
import { respondWithError } from '../utils/respond-with-error.util.js';

const router = Router();

/**
 * POST /api/webhooks/clerk
 * Svix-signed Clerk events → users / workspaces / workspace_members sync.
 * A 5xx response makes Clerk retry, which covers out-of-order delivery.
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
  if (!env.CLERK_WEBHOOK_SIGNING_SECRET || !rawBody) {
    res.status(400).json({ success: false, error: 'Invalid webhook signature' });
    return;
  }

  let event: WebhookEvent;
  try {
    // verifyWebhook works on a Fetch Request, so rebuild one from the exact raw bytes
    const fetchRequest = new Request(`${req.protocol}://${req.get('host')}${req.originalUrl}`, {
      method: 'POST',
      headers: new Headers(
        Object.entries(req.headers).flatMap(([k, v]) =>
          v === undefined ? [] : [[k, Array.isArray(v) ? v.join(', ') : v] as [string, string]]
        )
      ),
      body: new Uint8Array(rawBody),
    });
    event = await verifyWebhook(fetchRequest, { signingSecret: env.CLERK_WEBHOOK_SIGNING_SECRET });
  } catch {
    res.status(400).json({ success: false, error: 'Invalid webhook signature' });
    return;
  }

  try {
    const result = await ClerkSyncService.handle(event);
    res.json({ success: true, type: event.type, result });
  } catch (error) {
    console.error(`[ClerkWebhooks] Failed to sync ${event.type}:`, error);
    respondWithError(res, error, 'Failed to sync Clerk event');
  }
});

export default router;
