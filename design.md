# Design System & UI/UX Specifications

## Document Information
- **System:** LeadPilot AI Design Guidelines
- **Version:** 1.0.0
- **Status:** Approved Baseline
- **Date:** October 13, 2026

---

## 1. Design Principles

- **High-Density B2B Interface:** Inspired by Linear, Vercel, and Raycast. Maximum signal-to-noise ratio, compact padding, and instant data scannability.
- **Fast Scanning & Keyboard Accessibility:** Keyboard shortcuts (`j`/`k` navigation, `Cmd+K` command palette, batch selection via `Shift+Click`).
- **Clear Semantic Status Indicators:** Visual micro-badges with glowing indicators allow SDRs to immediately spot `Hot Leads` and positive responses.
- **Subtle Glassmorphism & Depth:** Dark-mode primary palette with subtle borders (`1px border-white/10`), backdrop blur (`blur-md`), and radial background gradients.

---

## 2. Color Palette & Semantic Tokens

### 2.1 Neutral Foundation (Dark Mode First)
- **Background Root:** `#090d16` (Deep Obsidian Void)
- **Radial Accent Background:** `radial-gradient(circle at 50% 0%, #1e1b4b 0%, #090d16 60%, #030712 100%)`
- **Surface Card / Glass Panel:** `rgba(15, 23, 42, 0.75)` with `border: rgba(255, 255, 255, 0.08)`
- **Foreground Primary:** `#f8fafc` (Slate 50)
- **Foreground Secondary:** `#94a3b8` (Slate 400)
- **Foreground Muted:** `#64748b` (Slate 500)

### 2.2 Brand Accents
- **Brand Primary:** `#0284c7` (Sky 600)
- **Brand Glow:** `rgba(2, 132, 199, 0.25)`
- **Brand Gradient:** `linear-gradient(to right, #38bdf8, #818cf8)`

### 2.3 Semantic Status Indicators
| Status / Intent | Background Token | Border Token | Text Token | Icon Indicator |
| :--- | :--- | :--- | :--- | :--- |
| **Hot Lead / INTERESTED** | `bg-emerald-950/40` | `border-emerald-500/40` | `text-emerald-400` | Flame / CheckCircle |
| **Warm Lead / QUESTION** | `bg-amber-950/40` | `border-amber-500/40` | `text-amber-400` | HelpCircle / Clock |
| **Cold Lead / NEUTRAL** | `bg-sky-950/40` | `border-sky-500/30` | `text-sky-400` | MinusCircle |
| **NOT_INTERESTED / Bounced** | `bg-rose-950/40` | `border-rose-500/40` | `text-rose-400` | Ban / XCircle |
| **Generating / Processing** | `bg-violet-950/40` | `border-violet-500/40` | `text-violet-400` | Sparkles / Loader2 |

---

## 3. Typography Hierarchy

- **UI Body & Headings:** Geist Sans or Inter (`font-sans`)
  - Headings: `font-bold tracking-tight text-white`
  - Body: `text-sm text-slate-300 antialiased`
- **Code, Data & Metrics:** Geist Mono or JetBrains Mono (`font-mono`)
  - Lead Scores: `font-mono font-bold text-base text-sky-400`
  - Webhook Logs / Message IDs: `font-mono text-xs text-slate-400`

---

## 4. Core UI Component Specifications

### 4.1 Interactive Lead Data Table
- **Header:** Sticky table header with sortable columns: `Business Name`, `Category`, `Website`, `Phone`, `Lead Score`, `Status`, `Brochure Actions`.
- **Multi-Select Bar:** Floating bottom action pill appears when rows are selected (`"14 leads selected" ➡️ [Generate Brochures] [Add to Campaign] [Export CSV]`).
- **Inline Website Preview:** If `website` is present, renders clean domain favicon and outbound link; if `website: null`, displays high-visibility pill: `🔥 No Website (Prime Prospect)`.
- **Brochure Status Cell:** Shows PDF download icon button if generated, or one-click `Generate Pitch Brochure` trigger with inline loader spinner.

### 4.2 Campaign Builder Wizard
- **Step 1 (Demographic & Query Setup):** Input for user service and target location with real-time preview of Gemini's 5–10 expanded search queries.
- **Step 2 (Outreach Copy & Brochure Variable):** Rich email body editor supporting handlebars tags: `{{businessName}}`, `{{contactName}}`, and `{{pdfUrl}}`.
- **Step 3 (Deliverability Schedule):** Setting daily limits (e.g. 50 emails/day), time windows (09:00–18:00), and sender mailbox selection.

### 4.3 PDF Template Previewer
- Split-pane layout:
  - Left Pane: Dynamic JSON schema editor / field controls.
  - Right Pane: High-fidelity A4 live preview of the rendered EJS brochure template with print-margin guides.

### 4.4 Unified Real-Time Inbox
- Two-column interface:
  - Left Column: Active reply threads with sentiment pills (`INTERESTED`, `QUESTION`).
  - Right Column: Full email thread, Gemini-suggested response action, and one-click "Send Pre-Drafted Reply".

### 4.5 Socket.io Toast Notifications
- **Position:** Fixed bottom-right overlay (`fixed bottom-6 right-6 z-50`).
- **Styling:** Emerald glowing border, backdrop blur, ambient pulsing animation.
- **Content:** Prospect business name, quote snippet from incoming email, and "Open Thread" direct action button.
