'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { Bot, ChevronDown, Sparkles, Brain, MessageSquare } from 'lucide-react';
import { LlmProvider } from '../../types/llm-provider.enum.js';
import { getAiProvider, setAiProvider, type AvailableProvider } from '../../lib/ai-provider.api.js';

const PROVIDER_META: Record<LlmProvider, { label: string; shortLabel: string; icon: React.ReactNode; color: string }> = {
  [LlmProvider.GEMINI]: {
    label: 'Google Gemini',
    shortLabel: 'Gemini',
    icon: <Sparkles className="h-3.5 w-3.5" />,
    color: 'text-blue-400',
  },
  [LlmProvider.CLAUDE]: {
    label: 'Anthropic Claude',
    shortLabel: 'Claude',
    icon: <Brain className="h-3.5 w-3.5" />,
    color: 'text-orange-400',
  },
  [LlmProvider.OPENAI]: {
    label: 'OpenAI ChatGPT',
    shortLabel: 'ChatGPT',
    icon: <MessageSquare className="h-3.5 w-3.5" />,
    color: 'text-emerald-400',
  },
};

const WORKSPACE_ID =
  typeof window !== 'undefined' ? (localStorage.getItem('workspaceId') ?? 'ws_dev_default') : 'ws_dev_default';

export function AiProviderSelector() {
  const [current, setCurrent] = useState<LlmProvider>(LlmProvider.GEMINI);
  const [available, setAvailable] = useState<AvailableProvider[]>([]);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getAiProvider(WORKSPACE_ID)
      .then(({ provider, availableProviders }) => {
        setCurrent(provider);
        setAvailable(availableProviders);
      })
      .catch(() => {
        /* server not ready yet — keep Gemini default */
      });
  }, []);

  const handleSelect = (provider: LlmProvider) => {
    setOpen(false);
    if (provider === current) return;
    startTransition(async () => {
      try {
        const updated = await setAiProvider(WORKSPACE_ID, provider);
        setCurrent(updated);
      } catch {
        /* silent — keep current */
      }
    });
  };

  const meta = PROVIDER_META[current];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={isPending}
        className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/60 px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-800/60 disabled:opacity-60"
        aria-label="Select AI provider"
      >
        <Bot className="h-3.5 w-3.5 text-slate-400 shrink-0" />
        <span className={`hidden sm:inline ${meta.color}`}>{meta.shortLabel}</span>
        <span className={`inline sm:hidden ${meta.color}`}>AI</span>
        <ChevronDown className={`h-3 w-3 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          {/* backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1.5 w-48 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-xl shadow-black/40">
            <div className="border-b border-slate-800 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">AI Engine</p>
            </div>
            {Object.values(LlmProvider).map((id) => {
              const m = PROVIDER_META[id];
              const info = available.find((a) => a.id === id);
              const configured = info?.configured !== false; // show as usable when available list not loaded
              const isSelected = id === current;
              return (
                <button
                  key={id}
                  onClick={() => configured && handleSelect(id)}
                  disabled={!configured}
                  className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-sm transition-colors
                    ${isSelected ? 'bg-indigo-600/15 text-white' : 'text-slate-300 hover:bg-slate-800/60'}
                    ${!configured ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}
                  `}
                >
                  <span className={m.color}>{m.icon}</span>
                  <span className="flex-1 text-left font-medium text-xs">{m.label}</span>
                  {isSelected && (
                    <span className="rounded-full bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-bold text-indigo-300 border border-indigo-500/30">
                      ACTIVE
                    </span>
                  )}
                  {!configured && (
                    <span className="text-[9px] text-slate-600">No key</span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
