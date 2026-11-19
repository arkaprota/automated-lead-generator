'use client';

import React from 'react';
import Link from 'next/link';
import { SignedIn, SignedOut, OrganizationSwitcher, UserButton } from '@clerk/nextjs';

/** Rendered only when a Clerk publishable key is configured (ClerkProvider mounted). */
export function AuthControls() {
  return (
    <div className="flex items-center gap-2">
      <SignedOut>
        <Link
          href="/sign-in"
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-900/60 hover:text-white"
        >
          Log in
        </Link>
        <Link
          href="/sign-up"
          className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-500"
        >
          Sign up
        </Link>
      </SignedOut>
      <SignedIn>
        <OrganizationSwitcher hidePersonal />
        <UserButton userProfileMode="navigation" userProfileUrl="/profile" />
      </SignedIn>
    </div>
  );
}
