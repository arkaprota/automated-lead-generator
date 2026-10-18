'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Database,
  RefreshCw,
  Globe,
  Phone,
  Mail,
  MapPin,
  Flame,
  Search,
  ExternalLink,
  ShieldCheck,
  Tag,
  Star,
  FileDown,
} from 'lucide-react';
import {
  fetchEventLeads,
  fetchEvents,
  triggerEventScrape,
  type EventLeadItem,
  type SearchEventItem,
} from '@/lib/events.api';
import { Navbar } from '@/components/navigation/Navbar';

export default function EventLeadsPage() {
  const params = useParams();
  const eventId = params.id as string;
  const [workspaceId] = useState('ws_dev_default');

  const [eventData, setEventData] = useState<SearchEventItem | null>(null);
  const [leads, setLeads] = useState<EventLeadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrapeLoading, setScrapeLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch leads for this event
      const leadsRes = await fetchEventLeads(workspaceId, eventId);
      if (leadsRes.success) {
        setLeads(leadsRes.leads || []);
      }

      // Fetch event details
      const eventsRes = await fetchEvents(workspaceId);
      if (eventsRes.success) {
        const found = eventsRes.events.find((e) => e.id === eventId);
        if (found) setEventData(found);
      }
    } catch (err) {
      console.error('Error loading event leads data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      loadData();
    }
  }, [eventId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleRunNow = async () => {
    setScrapeLoading(true);
    try {
      const res = await triggerEventScrape(workspaceId, eventId);
      if (res.success) {
        showToast(
          `Scrape completed! ${res.summary.newLeadsSaved} net-new leads added (duplicates skipped).`
        );
        await loadData();
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to execute scrape');
    } finally {
      setScrapeLoading(false);
    }
  };

  const filteredLeads = leads.filter((lead) => {
    const q = searchFilter.toLowerCase();
    return (
      lead.businessName.toLowerCase().includes(q) ||
      (lead.address && lead.address.toLowerCase().includes(q)) ||
      (lead.phone && lead.phone.toLowerCase().includes(q)) ||
      (lead.website && lead.website.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-indigo-500/40 bg-slate-900/95 p-4 text-sm text-indigo-200 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5">
          <ShieldCheck className="h-5 w-5 text-indigo-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Link & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Automated Search Events</span>
            </Link>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">
                  {eventData?.name || 'Dedicated Event Leads'}
                </h1>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                  <span className="flex items-center gap-1 text-slate-300">
                    <Tag className="h-3 w-3 text-indigo-400" />
                    {eventData?.category || 'Category'}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-300">
                    <MapPin className="h-3 w-3 text-rose-400" />
                    {eventData?.location || 'Location'}
                  </span>
                  <span>•</span>
                  <span className="text-emerald-400 font-medium">Zero-Duplicate Invariant Enforced</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunNow}
              disabled={scrapeLoading}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${scrapeLoading ? 'animate-spin' : ''}`} />
              <span>{scrapeLoading ? 'Scraping Google Maps...' : 'Scrape Google Maps Now'}</span>
            </button>
          </div>
        </div>

        {/* Filters and search bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search business, phone, address..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="rounded-full bg-slate-800/80 px-3 py-1 font-mono text-slate-300 border border-slate-700">
              Total Leads: <strong className="text-white">{leads.length}</strong>
            </span>
            <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-indigo-300 border border-indigo-500/20">
              Hot Prospects:{' '}
              <strong className="text-indigo-200">
                {leads.filter((l) => l.qualificationStatus === 'hot').length}
              </strong>
            </span>
          </div>
        </div>

        {/* Dedicated Leads Data Table */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="border-b border-slate-800 bg-slate-900/80 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                <tr>
                  <th scope="col" className="px-6 py-4">Business</th>
                  <th scope="col" className="px-6 py-4">Contact</th>
                  <th scope="col" className="px-6 py-4">Address</th>
                  <th scope="col" className="px-6 py-4">Lead Score</th>
                  <th scope="col" className="px-6 py-4">Qualification</th>
                  <th scope="col" className="px-6 py-4">Captured At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      <RefreshCw className="mx-auto h-6 w-6 animate-spin text-indigo-500 mb-2" />
                      Loading leads captured by this event...
                    </td>
                  </tr>
                ) : filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-14 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/60 text-slate-500 mb-3">
                        <Database className="h-6 w-6" />
                      </div>
                      <h4 className="text-base font-semibold text-white">No leads captured yet</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        This automated event will trigger scraping daily, or you can trigger an immediate scrape now.
                      </p>
                      <button
                        onClick={handleRunNow}
                        disabled={scrapeLoading}
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${scrapeLoading ? 'animate-spin' : ''}`} />
                        Trigger Scrape Now
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => {
                    const isHot = lead.qualificationStatus === 'hot';
                    const hasWebsite = Boolean(lead.website);

                    return (
                      <tr key={lead.id} className="hover:bg-slate-800/30 transition-colors">
                        {/* Business Name */}
                        <td className="px-6 py-4">
                          <div className="font-semibold text-white">{lead.businessName}</div>
                          {lead.rawMetadata?.rating && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-amber-400">
                              <Star className="h-3 w-3 fill-current" />
                              <span>{lead.rawMetadata.rating.toFixed(1)}</span>
                              {lead.rawMetadata?.reviewsCount && (
                                <span className="text-slate-500">
                                  ({lead.rawMetadata.reviewsCount} reviews)
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Contact (Phone & Website) */}
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {lead.phone ? (
                              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                                <Phone className="h-3.5 w-3.5 text-slate-500" />
                                <span>{lead.phone}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-600 italic">No phone</span>
                            )}

                            {hasWebsite ? (
                              <a
                                href={lead.website!}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:underline"
                              >
                                <Globe className="h-3 w-3" />
                                <span className="max-w-[150px] truncate">{lead.website}</span>
                                <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            ) : (
                              <div className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-500/20">
                                No Website (Hot Prospect!)
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Address */}
                        <td className="px-6 py-4 text-xs text-slate-400 max-w-xs truncate">
                          {lead.address || 'Location pending'}
                        </td>

                        {/* Lead Score */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-lg px-2 py-0.5 font-mono text-xs font-bold border ${
                                lead.leadScore >= 80
                                  ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                                  : lead.leadScore >= 50
                                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                  : 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}
                            >
                              {lead.leadScore}/100
                            </span>
                          </div>
                        </td>

                        {/* Qualification */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                              isHot
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                : lead.qualificationStatus === 'warm'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {isHot && <Flame className="h-3 w-3 text-rose-400" />}
                            {lead.qualificationStatus.toUpperCase()}
                          </span>
                        </td>

                        {/* Captured At */}
                        <td className="px-6 py-4 text-xs text-slate-400">
                          {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : 'Today'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
