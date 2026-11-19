import { verifyToken } from '@clerk/backend';
import { env } from '../config/env.js';
import type { VerifiedIdentity } from '../types/verified-identity.interface.js';

/** Verifies a Clerk session JWT; returns null for any invalid, expired, or foreign-origin token. */
export async function verifyClerkToken(token: string): Promise<VerifiedIdentity | null> {
  try {
    const payload = await verifyToken(token, {
      secretKey: env.CLERK_SECRET_KEY,
      authorizedParties: [env.FRONTEND_URL],
    });
    const claims = payload as typeof payload & { org_id?: string; o?: { id?: string } };
    return { userId: payload.sub, workspaceId: claims.o?.id ?? claims.org_id ?? null };
  } catch {
    return null;
  }
}

export function extractBearerToken(header: string | undefined): string | null {
  return header?.startsWith('Bearer ') ? header.slice(7).trim() || null : null;
}
