'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, CalendarSync, LayoutDashboard, Database, Activity } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Instant Generator', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Automated Search Events', href: '/events', icon: CalendarSync },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2.5 font-bold tracking-tight text-white group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg leading-tight font-black bg-gradient-to-r from-white via-slate-200 to-indigo-200 bg-clip-text text-transparent">
                LeadPilot <span className="text-indigo-400">AI</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">B2B Growth Engine</span>
            </div>
          </Link>

          <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href === '/events' && pathname?.startsWith('/events'));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm shadow-indigo-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                  <span className="hidden sm:inline">{item.label}</span>
                  <span className="inline sm:hidden">{item.href === '/dashboard' ? 'Generator' : 'Events'}</span>
                  {item.href === '/events' && (
                    <span className="ml-0.5 rounded-full bg-indigo-500/20 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-indigo-300 border border-indigo-500/30">
                      CRUD
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Zero Duplicates Active</span>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-300">
            <Database className="h-3.5 w-3.5 text-indigo-400" />
            <span className="font-mono text-slate-400">ws_dev_default</span>
          </div>
        </div>
      </div>
    </header>
  );
}
