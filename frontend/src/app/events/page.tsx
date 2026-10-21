'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CalendarSync,
  Plus,
  Play,
  Square,
  RefreshCw,
  Trash2,
  ExternalLink,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  MapPin,
  Tag,
  AlertCircle,
  Database,
} from 'lucide-react';
import {
  fetchEvents,
  toggleEventStatus,
  triggerEventScrape,
  deleteSearchEvent,
  type SearchEventItem,
} from '@/lib/events.api';
import { EventCreateModal } from '@/components/events/EventCreateModal';
import { getSocket } from '@/lib/socket';

export default function EventsPage() {
  const [workspaceId] = useState('ws_dev_default');
  const [events, setEvents] = useState<SearchEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Load events
  const loadEvents = async () => {
    try {
      setLoading(true);
      const res = await fetchEvents(workspaceId);
      if (res.success) {
        setEvents(res.events || []);
      }
    } catch (err) {
      console.error('Error fetching search events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();

    // Listen to real-time event updates via Socket.io
    const socket = getSocket();
    if (socket) {
      socket.emit('join:workspace', workspaceId);

      socket.on('event:updated', (payload: { eventId: string; status: string; totalLeadsFound: number; lastRunAt: string }) => {
        setEvents((prev) =>
          prev.map((item) =>
            item.id === payload.eventId
              ? {
                  ...item,
                  status: payload.status as SearchEventItem['status'],
                  totalLeadsFound: payload.totalLeadsFound,
                  lastRunAt: payload.lastRunAt,
                }
              : item
          )
        );
        showToast(`Event updated: ${payload.totalLeadsFound} leads total.`);
      });
    }

    return () => {
      if (socket) {
        socket.off('event:updated');
      }
    };
  }, [workspaceId]);

  const showToast = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  // Toggle Start / Stop
  const handleToggleStatus = async (event: SearchEventItem) => {
    const nextStatus = event.status === 'active' ? 'stopped' : 'active';
    setActionLoadingId(event.id);
    try {
      const res = await toggleEventStatus(workspaceId, event.id, nextStatus);
      if (res.success && res.event) {
        setEvents((prev) => prev.map((e) => (e.id === event.id ? res.event : e)));
        showToast(
          nextStatus === 'active'
            ? `Event "${event.name}" is now ACTIVE and will scrape daily.`
            : `Event "${event.name}" STOPPED. No further daily scrapes will run.`
        );
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Run On-Demand Trigger
  const handleTriggerScrape = async (event: SearchEventItem) => {
    setActionLoadingId(`trigger_${event.id}`);
    try {
      const res = await triggerEventScrape(workspaceId, event.id);
      if (res.success) {
        showToast(`Scrape completed! ${res.summary.newLeadsSaved} net-new leads added (duplicates skipped).`);
        await loadEvents();
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to execute scrape');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete Event
  const handleDeleteEvent = async (event: SearchEventItem) => {
    if (!confirm(`Are you sure you want to delete "${event.name}"? This stops all future scheduled runs.`)) {
      return;
    }
    setActionLoadingId(`delete_${event.id}`);
    try {
      const res = await deleteSearchEvent(workspaceId, event.id);
      if (res.success) {
        setEvents((prev) => prev.filter((e) => e.id !== event.id));
        showToast(`Event "${event.name}" deleted.`);
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to delete event');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredEvents = events.filter((e) => {
    const q = searchQuery.toLowerCase();
    return (
      e.name.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q) ||
      e.location.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 w-full">
      {/* Toast Notification */}
      {notificationMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-indigo-500/40 bg-slate-900/95 p-4 text-sm text-indigo-200 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="h-5 w-5 text-indigo-400 shrink-0" />
          <span>{notificationMsg}</span>
        </div>
      )}

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-600/20">
                <CalendarSync className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">
                  Automated Search Events
                </h1>
                <p className="text-xs text-slate-400">
                  Daily recurring Google Maps scrapers running autonomously until stopped. Zero duplicate leads guaranteed.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Create Search Event</span>
            </button>
          </div>
        </div>

        {/* Filters and search bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search category, location, title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Active Events:</span>
            <span className="font-bold text-emerald-400">
              {events.filter((e) => e.status === 'active').length}
            </span>
            <span className="mx-1">•</span>
            <span>Total Captured Leads:</span>
            <span className="font-bold text-indigo-400">
              {events.reduce((acc, curr) => acc + (curr.totalLeadsFound || 0), 0)}
            </span>
          </div>
        </div>

        {/* Events CRUD Data Table */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="border-b border-slate-800 bg-slate-900/80 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                <tr>
                  <th scope="col" className="px-6 py-4">Event & Category</th>
                  <th scope="col" className="px-6 py-4">Location</th>
                  <th scope="col" className="px-6 py-4">Schedule</th>
                  <th scope="col" className="px-6 py-4">Status</th>
                  <th scope="col" className="px-6 py-4">Leads Found</th>
                  <th scope="col" className="px-6 py-4">Last Scraped</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      <RefreshCw className="mx-auto h-6 w-6 animate-spin text-indigo-500 mb-2" />
                      Loading automated search events...
                    </td>
                  </tr>
                ) : filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-14 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/60 text-slate-500 mb-3">
                        <CalendarSync className="h-6 w-6" />
                      </div>
                      <h4 className="text-base font-semibold text-white">No search events found</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        Automate your lead generation by specifying a category (e.g. Restaurant) and location (e.g. Kolkata).
                      </p>
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Create First Search Event
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((event) => {
                    const isActive = event.status === 'active';
                    const isRowBusy =
                      actionLoadingId === event.id ||
                      actionLoadingId === `trigger_${event.id}` ||
                      actionLoadingId === `delete_${event.id}`;

                    return (
                      <tr
                        key={event.id}
                        className="hover:bg-slate-800/30 transition-colors group"
                      >
                        {/* Event Name & Category */}
                        <td className="px-6 py-4">
                          <div className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                            {event.name}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400">
                            <Tag className="h-3 w-3 text-indigo-400" />
                            <span>{event.category}</span>
                          </div>
                        </td>

                        {/* Location */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-xs text-slate-300">
                            <MapPin className="h-3.5 w-3.5 text-rose-400" />
                            <span>{event.location}</span>
                          </div>
                        </td>

                        {/* Schedule */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Clock className="h-3.5 w-3.5 text-slate-500" />
                            <span>Daily ({event.scheduleCron})</span>
                          </div>
                        </td>

                        {/* Status (Start / Stop badge) */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                              isActive
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                              }`}
                            />
                            {isActive ? 'Active (Running)' : 'Stopped'}
                          </span>
                        </td>

                        {/* Total Leads Found */}
                        <td className="px-6 py-4">
                          <Link
                            href={`/events/${event.id}/leads`}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 underline underline-offset-4 decoration-indigo-500/50"
                          >
                            <Database className="h-3.5 w-3.5" />
                            <span>{event.totalLeadsFound || 0} Leads</span>
                          </Link>
                        </td>

                        {/* Last Scraped */}
                        <td className="px-6 py-4 text-xs text-slate-400">
                          {event.lastRunAt
                            ? new Date(event.lastRunAt).toLocaleString()
                            : 'Pending first run'}
                        </td>

                        {/* Actions: Start/Stop, Run Now, View Leads, Delete */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Start / Stop Toggle Button */}
                            <button
                              onClick={() => handleToggleStatus(event)}
                              disabled={isRowBusy}
                              title={isActive ? 'Click to Stop daily scraping' : 'Click to Resume daily scraping'}
                              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                                isActive
                                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                                  : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                              } disabled:opacity-50`}
                            >
                              {isActive ? (
                                <>
                                  <Square className="h-3 w-3 fill-current" />
                                  <span>Stop</span>
                                </>
                              ) : (
                                <>
                                  <Play className="h-3 w-3 fill-current" />
                                  <span>Start</span>
                                </>
                              )}
                            </button>

                            {/* Run Now Trigger */}
                            <button
                              onClick={() => handleTriggerScrape(event)}
                              disabled={isRowBusy}
                              title="Scrape immediately right now"
                              className="p-1.5 rounded-lg border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
                            >
                              <RefreshCw
                                className={`h-3.5 w-3.5 ${
                                  actionLoadingId === `trigger_${event.id}` ? 'animate-spin text-indigo-400' : ''
                                }`}
                              />
                            </button>

                            {/* View Dedicated Leads */}
                            <Link
                              href={`/events/${event.id}/leads`}
                              title="View dedicated leads for this event"
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs font-medium text-slate-300 hover:text-indigo-300 hover:border-indigo-500/30 transition-colors"
                            >
                              <ExternalLink className="h-3 w-3 text-indigo-400" />
                              <span>View</span>
                            </Link>

                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteEvent(event)}
                              disabled={isRowBusy}
                              title="Delete event"
                              className="p-1.5 rounded-lg border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
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

      {/* Create Event Dialog Modal */}
      <EventCreateModal
        isOpen={isModalOpen}
        workspaceId={workspaceId}
        onClose={() => setIsModalOpen(false)}
        onCreated={(newEvent) => {
          setEvents((prev) => [newEvent, ...prev]);
          showToast(`Automated event "${newEvent.name}" created and scheduled!`);
        }}
      />
    </div>
  );
}
