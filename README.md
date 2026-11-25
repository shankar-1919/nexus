# NEXUS AI — Intelligent Community Problem Detection & Response Platform

## Project Overview
**NEXUS AI** is a full-stack civic infrastructure management prototype that connects citizens, AI-assisted triage, municipal administrators, and field officers in a single transparent workflow:

**Citizens → AI Analysis → Administrator (Human Review) → Field Officer → Verified Resolution → Citizen Feedback**

> **Disclaimer:** NEXUS AI is a hackathon demonstration prototype using seeded sample records in Hyderabad. It is not an officially deployed government reporting portal.

---

## Problem Statement
Local infrastructure issues—such as potholes, garbage overflow, water pipeline leaks, damaged roads, broken streetlights, and blocked stormwater drains—are often reported through fragmented channels. Citizens rarely receive transparent status updates, while municipal teams spend significant time manually triaging severity and routing tickets to the right department.

## Solution
NEXUS AI provides a unified, human-centered platform where:
1. Citizens report issues in seconds using a guided 5-step wizard with optional photos and interactive map pinning.
2. Structured AI triage (via Gemini multimodal API when configured, or clearly labeled deterministic demo rules) assesses issue category, severity, location context, department routing, and recommended next actions.
3. Administrators retain full human-in-the-loop oversight to review assessments, approve or reject reports, adjust priority, and assign field officers.
4. Field officers manage tasks on desktop or mobile, update progress, upload completion evidence photographs, and close incidents.
5. Citizens track every stage on a 7-step timeline and submit post-resolution feedback.

---

## Key Features
- **Guided 5-Step Reporting Wizard**: Category selection cards, photograph upload/camera capture with preview/replace/remove (or text-only fallback), description, manual/browser-GPS/map location picker, and final review.
- **Honest AI Triage & 5-Agent Workflow**: Visualizes Detection, Severity, Location, Department, and Response agents prior to mandatory Human Approval. Never fabricates confidence scores in demo mode.
- **Human-in-the-Loop Operations Console**: KPI cards, searchable/filterable/sortable reports table, Pending Review queue, confirmation dialogs, and 4 Recharts analytics charts.
- **Field Officer Task Workspace**: Mobile-friendly task cards with Accept Task, Start Work, View Location on Map, Completion Photo Upload, and Mark Resolved actions.
- **Interactive Community Map**: Leaflet map with severity-colored markers (`Low` Green, `Medium` Amber, `High` Orange, `Critical` Red), Map/List view toggle, multi-filters, and hide-resolved toggle.
- **Community Insights**: Data-driven insights and actionable recommendations computed directly from the shared complaint dataset.
- **In-App Notifications & Bilingual UI**: Real-time toast alerts, notification popover panel, Light/Dark theme switcher, and live **English / Telugu (`తెలుగు`)** interface localization.
- **Persistent SQLite Storage**: All complaints, notes, timeline entries, resolution details, and citizen feedback persist across refreshes in SQLite (`data/nexus.db`) with client-side cache fallback.

---

## User Roles (Demo Mode)
No external account setup is required. Switch roles anytime from `/login` or the top navigation bar:
- **Citizen**: Report issues, upload photos, view personal & community reports, track 7-stage timelines, add information, and submit post-resolution feedback.
- **Administrator**: Monitor KPIs, review pending AI assessments, approve/reject reports, edit priority/department, assign field officers, add notes, and inspect analytics.
- **Field Officer**: View assigned tasks, accept tasks, start work (`In Progress`), inspect locations on the map, upload completion evidence, and mark issues `Resolved`.

---

## UI/UX Design
Designed with restraint and clarity inspired by modern civic-tech and productivity tools:
- **Palette**: `#F7F8FA` light canvas, `#FFFFFF` card surfaces, `#172033` primary ink, `#64748B` secondary text, `#E5E7EB` hairline borders, `#4F46E5` brand indigo, `#0891B2` cyan accent, `#16A34A` success, `#D97706` warning, `#DC2626` critical, and `#111827` dark sidebar.
- **Typography**: `Plus Jakarta Sans` headings, `DM Sans` body text, and `JetBrains Mono` with tabular numerals for complaint IDs, coordinates, and metrics.
- **Accessibility**: Semantic HTML buttons/landmarks, keyboard-accessible dialogs, paired icon + text severity/status indicators, and `prefers-reduced-motion` support.

---

## AI Workflow
Every submitted report runs through five logical triage stages before reaching an administrator:
1. **Detection Agent** — Classifies the reported infrastructure issue from text and image.
2. **Severity Agent** — Estimates urgency (`Low`, `Medium`, `High`, `Critical`).
3. **Location Agent** — Maps street address and coordinates to the neighborhood zone.
4. **Department Agent** — Recommends the responsible municipal department.
5. **Response Agent** — Suggests immediate next actions and response timeframe.

All recommendations land in **Awaiting Review** until a human administrator approves or rejects them.

---

## Architecture & Technology Stack
- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS v4, React Router, Lucide React, Recharts, Leaflet.
- **Backend**: Node.js, Express (`server.ts`), Multer (image upload validation & storage in `uploads/`), REST API (`/api/*`).
- **Database**: SQLite via `better-sqlite3` (`data/nexus.db`), automatically seeded with 9 realistic demonstration complaints across all categories and statuses.
- **AI Integration**: `@google/genai` SDK (`gemini-4-hydrogen`) executed strictly server-side in `server/ai.ts`, with a deterministic rule-based demo fallback.

---

## Project Structure
```text
├── server.ts                  # Express REST API + Vite middleware entry point
├── server/
│   ├── db.ts                  # SQLite schema, seeding, and persistence helpers
│   └── ai.ts                  # Server-side Gemini multimodal triage + demo fallback
├── public/demo-photos/        # Local civic illustration assets for seeded reports
├── src/
│   ├── App.tsx                # Application router
│   ├── context/AppContext.tsx # Live API state, role switcher, i18n, theme, notifications
│   ├── types/complaint.ts     # Core TypeScript domain models
│   ├── lib/
│   │   ├── workflow.ts        # Pure KPI, analytics, filtering, and deterministic triage rules
│   │   ├── workflow.test.ts   # Unit tests (node:test)
│   │   ├── seedData.ts        # 9 shared demonstration complaints
│   │   └── i18n.ts            # English & Telugu interface dictionary
│   ├── components/            # AppShell, AIAnalysisCard, ComplaintTimeline, LeafletMap, etc.
│   └── pages/                 # Landing, DemoLogin, Citizen, Report, Admin, Officer, Map, Insights, Settings
```

---

## Installation & Run Commands
```bash
# Install dependencies
npm install

# Run full-stack development server (Express API + Vite frontend on port 3000)
npm run dev

# Run unit tests
npx tsx --test src/lib/workflow.test.ts

# Type-check & build for production
npm run lint
npm run build
```

---

## Environment Configuration & Gemini API Setup
See `.env.example`:
```env
GEMINI_API_KEY="your_gemini_api_key"
```
- **When `GEMINI_API_KEY` is configured**: `server/ai.ts` sends the citizen description, location, and uploaded image to `gemini-4-hydrogen` with a structured JSON schema and labels results as **AI-Assisted Analysis**.
- **Demo Fallback (No API Key Required)**: When `GEMINI_API_KEY` is unset or unavailable, NEXUS AI automatically uses deterministic demonstration rules in `src/lib/workflow.ts` and transparently labels output as **Demo AI Assessment — Generated using predefined demonstration rules** without fabricating confidence scores.

---

## Demo Presentation Workflow
1. Open the **Landing Page** (`/`) and click **Get Started** or **Report a Problem**.
2. Choose **Continue as Citizen** on the Demo Login page.
3. Complete the 5-step **Report a Problem** wizard (e.g., select *Pothole*, attach a photo or sample image, add details and location, submit).
4. Inspect the generated Complaint ID, **AI Assessment**, and **5-Agent Workflow**.
5. Switch to **Administrator** via the top bar role selector, open **Pending Review**, verify the report, click **Approve Report**, and **Assign Field Officer**.
6. Switch to **Field Officer**, open **My Field Tasks**, click **Accept Task** → **Start Work** → **Mark Resolved** with a completion photo and note.
7. Switch back to **Citizen**, open **My Reports**, inspect the updated 7-stage timeline, and submit star feedback.
8. Switch to **Administrator → Analytics** to show live updated Recharts metrics.

---

## Limitations & Future Improvements
- **Limitations**: Demo authentication uses role switching rather than SSO/OAuth; notifications are in-app only (no SMS/email gateway); map tiles rely on OpenStreetMap/CARTO tile servers.
- **Future Improvements**: Municipal GIS ward boundary overlays, duplicate complaint proximity clustering, offline PWA background sync for field crews, and real SMS/push notification gateways.
