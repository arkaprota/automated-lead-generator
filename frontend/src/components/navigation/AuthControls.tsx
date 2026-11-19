'use client';

import React from 'react';
import { SignedIn, SignedOut, SignInButton, OrganizationSwitcher, UserButton } from '@clerk/nextjs';

/** Rendered only when a Clerk publishable key is configured (ClerkProvider mounted). */
export function AuthControls() {
  return (
    <div className="flex items-center gap-2">
      <SignedOut>
        <SignInButton mode="modal">
          <button className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500">
            Sign in
          </button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <OrganizationSwitcher hidePersonal />
        <UserButton />
      </SignedIn>
    </div>
  );
}
