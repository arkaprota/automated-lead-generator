import { SignIn } from '@clerk/nextjs';
import { AuthPageShell } from '@/components/auth/AuthPageShell';
import { AuthNotConfigured } from '@/components/auth/AuthNotConfigured';
import { clerkEnabled } from '@/lib/clerk-enabled';

// "Forgot password?" (email reset code → new password) is part of Clerk's <SignIn /> flow
export default function SignInPage() {
  return (
    <AuthPageShell title="Welcome back" subtitle="Log in to your LeadPilot workspace">
      {clerkEnabled ? <SignIn /> : <AuthNotConfigured />}
    </AuthPageShell>
  );
}
