import React from 'react';
import { Sparkles } from 'lucide-react';

export function AuthPageShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main
      className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12"
      style={{ background: 'radial-gradient(circle at 50% 0%, #1e1b4b 0%, #090d16 60%, #030712 100%)' }}
    >
      <div className="flex w-full max-w-md flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-sky-400 to-indigo-400 shadow-lg shadow-sky-500/25">
            <Sparkles className="h-5 w-5 text-white" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
          <p className="text-sm text-slate-400">{subtitle}</p>
        </div>
        {children}
      </div>
    </main>
  );
}
