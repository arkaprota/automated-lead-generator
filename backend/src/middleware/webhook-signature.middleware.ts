import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

export const WEBHOOK_SIGNATURE_HEADER = 'x-webhook-signature';

export function signWebhookBody(rawBody: Buffer | string, secret: string): string {
  return `sha256=${createHmac('sha256', secret).update(rawBody).digest('hex')}`;
}

/** Rejects any webhook whose `x-webhook-signature` is not the HMAC-SHA256 of the raw body. Fails closed. */
export function verifyWebhookSignature(req: Request, res: Response, next: NextFunction): void {
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
  const received = req.get(WEBHOOK_SIGNATURE_HEADER);

  if (!env.WEBHOOK_SECRET || !rawBody || !received) {
    res.status(401).json({ success: false, error: 'Invalid webhook signature' });
    return;
  }

  const expected = Buffer.from(signWebhookBody(rawBody, env.WEBHOOK_SECRET));
  const actual = Buffer.from(received);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    res.status(401).json({ success: false, error: 'Invalid webhook signature' });
    return;
  }
  next();
}
