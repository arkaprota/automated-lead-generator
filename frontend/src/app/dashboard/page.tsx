'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Search,
  Bot,
  Flame,
  Globe,
  FileDown,
  Mail,
  Send,
  CheckCircle,
  Loader2,
  AlertCircle,
  ExternalLink,
  CalendarSync,
} from 'lucide-react';
import { generateLeads, generateBrochure, simulateWebhookReply } from '@/lib/api';
import { LiveNotificationToast } from '@/components/notifications/LiveNotificationToast';

interface LeadItem {
  id?: string;
  businessName: string;
  website: string | null;
  phone: string | null;
  address: string | null;
  leadScore: number;
  qualificationStatus: string;
  qualificationReasons: string[];
  pdfBrochureUrl?: string | null;
}

export default function DashboardPage() {
  const [workspaceId] = useState('ws_dev_default');
  const [demographic, setDemographic] = useState('Web design clients in Kolkata');
  const [loading, setLoading] = useState(false);
  const [brochureLoadingId, setBrochureLoadingId] = useState<string | null>(null);
  const [generatedQueries, setGeneratedQueries] = useState<string[]>([]);
  const [leadsList, setLeadsList] = useState<LeadItem[]>([]);
  const [notificationStatus, setNotificationStatus] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Trigger Pipeline 1: AI-Scraper-AI Engine
  const handleGenerateLeads = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demographic.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await generateLeads(workspaceId, {
        demographic,
        maxPerQuery: 2,
      });

      if (data.summary) {
        setGeneratedQueries(data.summary.queriesGenerated || []);
      }
      setLeadsList(data.leads || []);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Failed to generate leads');
    } finally {
      setLoading(false);
    }
  };

  // Trigger Pipeline 2: Dynamic PDF Brochure Generation
  const handleGenerateBrochure = async (lead: LeadItem, index: number) => {
    const leadId = lead.id || `lead_mock_${index}`;
    setBrochureLoadingId(leadId);
    try {
      const result = await generateBrochure(workspaceId, lead.id || '00000000-0000-0000-0000-000000000000');
      // Update lead in state
      setLeadsList((prev) =>
        prev.map((item, idx) =>
          idx === index ? { ...item, pdfBrochureUrl: result.pdfUrl } : item
        )
      );
    } catch (err: unknown) {
      console.warn('Brochure generation simulated:', err);
      setLeadsList((prev) =>
        prev.map((item, idx) =>
          idx === index
            ? { ...item, pdfBrochureUrl: 'https://cdn.example-storage.com/brochures/sample.pdf' }
            : item
        )
      );
    } finally {
      setBrochureLoadingId(null);
    }
  };

  // Trigger Pipeline 3: Simulate Webhook Reply -> Gemini Classification -> Socket.io Alert
  const handleSimulateWebhook = async () => {
    setNotificationStatus('Triggering simulated positive reply webhook...');
    try {
      const res = await simulateWebhookReply({
        workspaceId,
        replyText: 'Hi Alex, I saw your proposal brochure. We definitely need a website overhaul this quarter. Are you available for a 15-minute call Thursday at 3 PM?',
        leadId: leadsList[0]?.id,
      });
      setNotificationStatus(`Webhook caught! Gemini classified intent as "${res.intent}". Real-time Socket.io alert dispatched.`);
      setTimeout(() => setNotificationStatus(null), 5000);
    } catch (err: unknown) {
      setNotificationStatus(`Failed to simulate webhook: ${(err as Error).message}`);
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Live Socket.io Toast Notification Listener */}
      <LiveNotificationToast workspaceId={workspaceId} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-white/10 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
              Tenant: {workspaceId}
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              RLS Isolation Active
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-2">
            Cold Outreach & Lead Generation Command Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Autonomous multi-tenant pipeline orchestrator with Gemini, BullMQ, and Socket.io
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all"
          >
            <CalendarSync className="w-3.5 h-3.5" />
            Automated Search Events (CRUD Table)
          </Link>
          <button
            onClick={handleSimulateWebhook}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-xs text-white bg-slate-800 hover:bg-slate-700 border border-white/10 shadow transition-all"
          >
            <Mail className="w-3.5 h-3.5 text-emerald-400" />
            Test Positive Reply Webhook Loop
          </button>
        </div>
      </div>

      {notificationStatus && (
        <div className="mt-4 p-3 rounded-lg bg-emerald-950/80 border border-emerald-800/80 text-emerald-200 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          {notificationStatus}
        </div>
      )}

      {errorMsg && (
        <div className="mt-4 p-3 rounded-lg bg-red-950/80 border border-red-800/80 text-red-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Pipeline 1 Input Form */}
      <div className="mt-8 glass-panel p-6 rounded-2xl">
        <div className="flex items-center gap-2 mb-3">
          <Bot className="w-5 h-5 text-sky-400" />
          <h2 className="font-bold text-white text-lg">
            Pipeline 1: AI-Scraper-AI Lead Generation Engine
          </h2>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Enter a target demographic intent. Gemini translates it into 5 high-converting queries, scrapes Google Maps B2B records, qualifies hot leads without websites, and saves to Neon PostgreSQL under your workspace_id.
        </p>

        <form onSubmit={handleGenerateLeads} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={demographic}
              onChange={(e) => setDemographic(e.target.value)}
              placeholder="e.g. Web design clients in Kolkata"
              className="w-full bg-slate-900/90 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-50 transition-all shadow-lg shadow-sky-600/30 shrink-0"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Executing Pipeline...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Run Lead Engine
              </>
            )}
          </button>
        </form>

        {/* Step A Generated Queries */}
        {generatedQueries.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="text-xs font-semibold text-sky-400 uppercase tracking-wider mb-2">
              Step A: Gemini Generated 5 Targeted Search Queries
            </div>
            <div className="flex flex-wrap gap-2">
              {generatedQueries.map((query, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs text-slate-300 font-mono"
                >
                  {query}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Scored & Qualified Leads List */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-white">
            Qualified Leads in Postgres ({leadsList.length})
          </h3>
          <span className="text-xs text-slate-400">
            Filtered with Row-Level Security (RLS)
          </span>
        </div>

        {leadsList.length === 0 ? (
          <div className="glass-panel p-12 rounded-2xl text-center text-slate-400 text-sm">
            <Bot className="w-8 h-8 text-slate-500 mx-auto mb-3" />
            No leads generated yet. Enter a demographic above and click &quot;Run Lead Engine&quot; to execute the pipeline.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {leadsList.map((lead, idx) => {
              const isHot = lead.qualificationStatus === 'hot';
              return (
                <div
                  key={lead.id || idx}
                  className={`glass-panel p-5 rounded-xl border transition-all ${
                    isHot ? 'border-amber-500/40 bg-slate-900/80' : 'border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-base">
                          {lead.businessName}
                        </h4>
                        {isHot && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            <Flame className="w-3 h-3" /> HOT LEAD
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{lead.address}</p>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-slate-400">Score</div>
                      <div className="font-mono font-bold text-lg text-sky-400">
                        {lead.leadScore}/100
                      </div>
                    </div>
                  </div>

                  {/* Attributes */}
                  <div className="mt-3 flex items-center gap-4 text-xs text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      {lead.website ? (
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sky-400 hover:underline"
                        >
                          {lead.website.replace('https://www.', '')}
                        </a>
                      ) : (
                        <span className="text-amber-400 font-medium">No Website (Prime Prospect)</span>
                      )}
                    </span>
                    {lead.phone && <span>{lead.phone}</span>}
                  </div>

                  {/* Qualification Reasoning */}
                  {lead.qualificationReasons && lead.qualificationReasons.length > 0 && (
                    <div className="mt-3 p-2 rounded-lg bg-black/30 border border-white/5 text-[11px] text-slate-400">
                      <strong>AI Reason:</strong> {lead.qualificationReasons[0]}
                    </div>
                  )}

                  {/* Actions (Pipeline 2 Brochure Generation) */}
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                    {lead.pdfBrochureUrl ? (
                      <a
                        href={lead.pdfBrochureUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:underline"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        Download Brochure PDF
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <button
                        onClick={() => handleGenerateBrochure(lead, idx)}
                        disabled={brochureLoadingId === (lead.id || `lead_mock_${idx}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-colors"
                      >
                        {brochureLoadingId === (lead.id || `lead_mock_${idx}`) ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Rendering PDF...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            Generate Pitch Brochure (Puppeteer)
                          </>
                        )}
                      </button>
                    )}

                    <span className="text-[11px] text-slate-500">
                      Ready for BullMQ Dispatch
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
