'use client';

import React, { useEffect, useState } from 'react';
import { Building2, Coins, Bot, ShieldCheck, Loader2, AlertTriangle } from 'lucide-react';
import { getProfile } from '@/lib/profile.api';
import type { ProfileResponse } from '@/types/profile.interface';

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-slate-950/60 px-4 py-3">
      <span className="text-sky-400">{icon}</span>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
        <div className="truncate text-sm font-semibold text-slate-100">{value}</div>
      </div>
    </div>
  );
}

/** Workspace details that live only in our database (plan, credits, role, AI provider). */
export function ProfileSummaryCard() {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProfile()
      .then(setProfile)
      .catch((err: Error) => setError(err.message));
  }, []);

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-rose-500/40 bg-rose-950/40 p-5 text-sm text-rose-300">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        {error}
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/75 p-5 text-sm text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading workspace…
      </div>
    );
  }

  const { user, workspace } = profile;
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email;

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/75 p-6 backdrop-blur">
      <div className="mb-5 flex items-center gap-4">
        {user?.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatarUrl} alt="" className="h-14 w-14 rounded-full border border-white/10" />
        ) : (
          <div className="h-14 w-14 rounded-full border border-white/10 bg-slate-800" />
        )}
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold tracking-tight text-white">{displayName ?? 'Account not synced yet'}</h2>
          {user ? (
            <p className="truncate text-sm text-slate-400">
              {user.email} · Member since {new Date(user.createdAt).toLocaleDateString()}
            </p>
          ) : (
            <p className="text-sm text-slate-400">Your account appears here once the backend has synced it from Clerk.</p>
          )}
        </div>
      </div>

      {workspace ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Stat icon={<Building2 className="h-4 w-4" />} label="Workspace" value={workspace.name} />
          <Stat icon={<ShieldCheck className="h-4 w-4" />} label="Role" value={workspace.role ?? '—'} />
          <Stat icon={<Coins className="h-4 w-4" />} label={`Plan · ${workspace.plan}`} value={`${workspace.creditsRemaining} credits left`} />
          <Stat icon={<Bot className="h-4 w-4" />} label="AI provider" value={workspace.aiProvider} />
        </div>
      ) : (
        <p className="text-sm text-slate-400">No workspace record yet — select or create an organization.</p>
      )}
    </section>
  );
}
