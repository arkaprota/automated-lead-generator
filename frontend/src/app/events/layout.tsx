import { RequireAuth } from '@/components/auth/RequireAuth';

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}
