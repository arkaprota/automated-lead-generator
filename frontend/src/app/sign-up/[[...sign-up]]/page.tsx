import { SignUp } from '@clerk/nextjs';
import { AuthPageShell } from '@/components/auth/AuthPageShell';
import { AuthNotConfigured } from '@/components/auth/AuthNotConfigured';
import { clerkEnabled } from '@/lib/clerk-enabled';

export default function SignUpPage() {
  return (
    <AuthPageShell title="Create your account" subtitle="Start generating and qualifying B2B leads">
      {clerkEnabled ? <SignUp /> : <AuthNotConfigured />}
    </AuthPageShell>
  );
}
