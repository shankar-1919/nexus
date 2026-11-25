import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Info, ShieldCheck } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { useApp } from '../context/AppContext';

export const HelpSupportPage: React.FC = () => {
  const { aiMode, t } = useApp();

  const demoSteps = [
    'Start as Citizen and open Report a Problem to submit a Pothole report with photo, description, and map pin.',
    'Review the instant AI Assessment and 5-agent triage summary on the confirmation screen.',
    'Switch to Administrator from the top bar, open Operations Overview → Pending Review, inspect the report, approve it, and assign a Field Officer.',
    'Switch to Field Officer, open My Field Tasks, accept the task, start work, upload completion proof, and mark it Resolved.',
    'Switch back to Citizen, open My Reports, inspect the 7-stage timeline, and submit post-resolution feedback.',
    'Switch back to Administrator → Analytics to see live updated Recharts metrics.',
  ];

  return (
    <AppShell breadcrumbs={[{ label: t.nav.helpSupport }]}>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#172033] dark:text-white">
            {t.nav.helpSupport}
          </h1>
          <p className="mt-1 text-sm text-[#64748B] dark:text-slate-400">
            Guidance for using NEXUS AI and running the complete end-to-end civic demonstration.
          </p>
        </div>

        <section className="rounded-xl border border-[#E5E7EB] bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4.5 w-4.5 text-[#4F46E5]" aria-hidden="true" />
            <h2 className="text-base font-semibold text-[#172033] dark:text-white">
              End-to-End Demo Walkthrough
            </h2>
          </div>
          <ol className="mt-4 space-y-3 text-sm leading-relaxed text-[#475569] dark:text-slate-300">
            {demoSteps.map((step, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="mt-0.5 font-mono text-xs font-semibold text-[#4F46E5] tabular-nums dark:text-indigo-400">
                  0{idx + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/report"
              className="rounded-lg bg-[#4F46E5] px-4 py-2 text-xs font-medium text-white hover:bg-[#4338CA]"
            >
              Start a Report
            </Link>
            <Link
              to="/login"
              className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-2 text-xs font-medium text-[#172033] hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              Open Role Selector
            </Link>
          </div>
        </section>

        <section className="rounded-xl border border-[#E5E7EB] bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4.5 w-4.5 text-[#0891B2]" aria-hidden="true" />
            <h2 className="text-base font-semibold text-[#172033] dark:text-white">
              AI Transparency & Human Oversight
            </h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-[#475569] dark:text-slate-300">
            Current analysis engine:{' '}
            <span className="font-semibold text-[#172033] dark:text-white">
              {aiMode === 'gemini'
                ? 'Gemini AI-Assisted Analysis'
                : 'Demo AI Assessment (Predefined Rules)'}
            </span>
            . Regardless of mode, NEXUS AI never dispatches field teams automatically — every complaint remains in Awaiting Review until a human administrator approves it.
          </p>
        </section>

        <section
          id="privacy"
          className="rounded-xl border border-[#E5E7EB] bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center gap-2">
            <Info className="h-4.5 w-4.5 text-[#64748B]" aria-hidden="true" />
            <h2 className="text-base font-semibold text-[#172033] dark:text-white">
              Prototype Disclaimer & Privacy
            </h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-[#475569] dark:text-slate-300">
            NEXUS AI is a hackathon demonstration prototype and is not affiliated with any official municipal authority. Seeded sample records represent fictionalized demonstration locations in Hyderabad. Community feeds hide personal contact details.
          </p>
        </section>
      </div>
    </AppShell>
  );
};
