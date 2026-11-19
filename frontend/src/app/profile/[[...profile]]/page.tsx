import { UserProfile } from '@clerk/nextjs';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { AuthNotConfigured } from '@/components/auth/AuthNotConfigured';
import { ProfileSummaryCard } from '@/components/profile/ProfileSummaryCard';
import { clerkEnabled } from '@/lib/clerk-enabled';

// Name, avatar, emails, sessions, delete account and Security → change password come from Clerk's <UserProfile />
export default function ProfilePage() {
  return (
    <RequireAuth>
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Profile</h1>
          <p className="text-sm text-slate-400">Your account, password and workspace.</p>
        </div>
        <ProfileSummaryCard />
        {clerkEnabled ? <UserProfile routing="path" path="/profile" /> : <AuthNotConfigured />}
      </main>
    </RequireAuth>
  );
}
