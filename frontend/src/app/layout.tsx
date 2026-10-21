import type { Metadata } from 'next';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { Navbar } from '@/components/navigation/Navbar';

export const metadata: Metadata = {
  title: 'LeadPilot AI - Automated Cold Outreach & B2B Lead Generation',
  description: 'AI-Scraper-AI lead generation engine, dynamic PDF brochure generator, and real-time reply classification.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  const content = (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
      <Navbar />
      <div className="flex-1">{children}</div>
    </div>
  );

  if (clerkKey && clerkKey.startsWith('pk_')) {
    return (
      <ClerkProvider publishableKey={clerkKey}>
        <html lang="en">
          <body className="bg-slate-950 text-slate-100 antialiased">{content}</body>
        </html>
      </ClerkProvider>
    );
  }

  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 antialiased">{content}</body>
    </html>
  );
}

