import React from 'react';
import { KeyRound } from 'lucide-react';

/** Shown instead of auth screens when no Clerk publishable key is configured. */
export function AuthNotConfigured() {
  return (
    <div className="w-full rounded-2xl border border-amber-500/40 bg-amber-950/40 p-6 text-sm text-slate-300">
      <div className="mb-2 flex items-center gap-2 font-semibold text-amber-400">
        <KeyRound className="h-4 w-4" />
        Authentication isn&apos;t configured
      </div>
      <p>
        Add <code className="font-mono text-xs text-slate-200">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> to{' '}
        <code className="font-mono text-xs text-slate-200">frontend/.env.local</code> and{' '}
        <code className="font-mono text-xs text-slate-200">CLERK_SECRET_KEY</code> to{' '}
        <code className="font-mono text-xs text-slate-200">backend/.env</code>, then restart both servers.
      </p>
    </div>
  );
}
