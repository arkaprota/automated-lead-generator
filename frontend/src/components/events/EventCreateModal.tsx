'use client';

import React, { useState } from 'react';
import { X, Sparkles, MapPin, Tag, Clock, Calendar, AlertCircle } from 'lucide-react';
import { createSearchEvent, type SearchEventItem } from '@/lib/events.api';

interface EventCreateModalProps {
  isOpen: boolean;
  workspaceId: string;
  onClose: () => void;
  onCreated: (event: SearchEventItem) => void;
}

export function EventCreateModal({ isOpen, workspaceId, onClose, onCreated }: EventCreateModalProps) {
  const [category, setCategory] = useState('Restaurant');
  const [location, setLocation] = useState('Kolkata');
  const [name, setName] = useState('Daily Restaurant Leads in Kolkata');
  const [timeHour, setTimeHour] = useState('09:00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Update suggested name dynamically
  const handleCategoryChange = (val: string) => {
    setCategory(val);
    setName(`Daily ${val} Leads in ${location}`);
  };

  const handleLocationChange = (val: string) => {
    setLocation(val);
    setName(`Daily ${category} Leads in ${val}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category.trim() || !location.trim()) {
      setError('Category and Location are required');
      return;
    }

    setLoading(true);
    setError(null);

    // Convert HH:MM into a standard daily cron: "0 <hour> * * *"
    const [hour] = timeHour.split(':');
    const scheduleCron = `0 ${parseInt(hour || '9', 10)} * * *`;

    try {
      const res = await createSearchEvent(workspaceId, {
        name: name.trim() || `${category} in ${location}`,
        category: category.trim(),
        location: location.trim(),
        scheduleCron,
        queryPrompt: `${category.trim()} businesses in ${location.trim()}`,
      });

      if (res.success && res.event) {
        onCreated(res.event);
        onClose();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create automated search event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl shadow-indigo-950/40">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Create Automated Search Event</h3>
              <p className="text-xs text-slate-400">Scrapes Google Maps daily with zero duplicate leads</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Category / Industry
            </label>
            <div className="relative">
              <Tag className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                required
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                placeholder="e.g. Restaurant, Dental Clinic, Cafe"
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Target Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                required
                value={location}
                onChange={(e) => handleLocationChange(e.target.value)}
                placeholder="e.g. Kolkata, London, New York"
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Event Title
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Daily Restaurant Leads in Kolkata"
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 px-3.5 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Frequency
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 px-3.5 text-sm text-slate-300">
                <Calendar className="h-4 w-4 text-indigo-400" />
                <span>Every Day</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Scheduled Time
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="time"
                  value={timeHour}
                  onChange={(e) => setTimeHour(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 pl-9 pr-3 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3 text-xs text-indigo-300">
            <span className="font-semibold text-indigo-200">Autonomous Invariant:</span> Searches Google Maps every day at {timeHour} until you click <strong>Stop</strong>. Already scraped leads are skipped automatically.
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/30 disabled:opacity-50"
            >
              {loading ? (
                <span>Creating...</span>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Start Autonomous Event</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
