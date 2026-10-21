import Link from 'next/link';
import { ArrowRight, Bot, Sparkles, Mail, FileText, Zap, ShieldCheck } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col justify-between p-6 md:p-12 max-w-7xl mx-auto">

      {/* Hero Section */}
      <div className="py-16 md:py-24 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20 mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          Autonomous Multi-Tenant Cold Email Engine
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Turn Raw Demographics into{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-indigo-400">
            Booked High-Ticket Calls
          </span>
        </h1>
        <p className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto">
          From query generation and Google Maps data scraping to Gemini qualification, personalized PDF brochure synthesis, and real-time reply classification.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 shadow-xl shadow-sky-500/25 transition-all transform hover:-translate-y-0.5"
          >
            Launch Command Center
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/events"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-slate-200 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 transition-all transform hover:-translate-y-0.5"
          >
            Automated Search Events
            <ArrowRight className="w-4 h-4 text-indigo-400" />
          </Link>
        </div>
      </div>

      {/* 3 Core Architecture Pillars */}
      <div className="grid md:grid-cols-3 gap-6 py-12">
        <div className="glass-panel p-6 rounded-2xl">
          <div className="h-10 w-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center mb-4">
            <Bot className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-lg text-white mb-2">1. AI-Scraper-AI Engine</h3>
          <p className="text-sm text-slate-400">
            Gemini expands target demographics into 5 high-intent queries, scrapes Google Maps B2B data, and qualifies leads by detecting missing websites.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-lg text-white mb-2">2. Dynamic PDF Brochures</h3>
          <p className="text-sm text-slate-400">
            Generates personalized pitch JSON, merges agency credentials via EJS templates, and compiles pixel-perfect PDF buffers with Puppeteer.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-lg text-white mb-2">3. Webhook Loop & Live Alerts</h3>
          <p className="text-sm text-slate-400">
            Classifies prospect replies via Gemini (INTERESTED, NOT_INTERESTED, QUESTION) and fires real-time Socket.io desktop notifications.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
        <div>PostgreSQL (Neon) with RLS • BullMQ & Redis • Google Gemini • Clerk Auth</div>
        <div className="mt-2 sm:mt-0">Production Monorepo Ready</div>
      </footer>
    </div>
  );
}
