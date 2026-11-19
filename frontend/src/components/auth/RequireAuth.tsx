'use client';

import React from 'react';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs';
import { clerkEnabled } from '@/lib/clerk-enabled';

/**
 * Sends signed-out visitors to /sign-in. UX only — the backend rejects every API call without a valid token.
 * Client-side because Clerk's Next.js middleware would need CLERK_SECRET_KEY in the frontend (AGENTS.md Rule 1).
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  if (!clerkEnabled) return <>{children}</>;
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
