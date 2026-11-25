import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardList,
  Compass,
  Gauge,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { useApp } from '../context/AppContext';
import { computeDashboardKPIs, generateCommunityInsights } from '../lib/workflow';

export const AIInsightsPage: React.FC = () => {
  const { complaints, aiMode, role, t } = useApp();

  const kpis = useMemo(() => computeDashboardKPIs(complaints), [complaints]);
  const { insights, recommendations } = useMemo(
    () => generateCommunityInsights(complaints),
    [complaints]
  );

  const workflowStages = [
    {
      num: '01',
      title: 'Detection',
      agent: 'Detection Agent',
      desc: 'Identifies the infrastructure problem category from submitted photo and text.',
      icon: Compass,
    },
    {
      num: '02',
      title: 'Severity Assessment',
      agent: 'Severity Agent',
      desc: 'Evaluates public safety risk and traffic impact to suggest priority.',
      icon: Gauge,
    },
    {
      num: '03',
      title: 'Location Processing',
      agent: 'Location Agent',
      desc: 'Maps coordinates to neighborhood wards and clusters nearby reports.',
      icon: MapPin,
    },
    {
      num: '04',
      title: 'Department Recommendation',
      agent: 'Department Agent',
      desc: 'Routes the issue to the matching municipal maintenance department.',
      icon: Building2,
    },
    {
      num: '05',
      title: 'Human Review',
      agent: 'Administrator Desk',
      desc: 'Coordinators inspect evidence, override priority if needed, and approve dispatch.',
      icon: ShieldCheck,
    },
    {
      num: '06',
      title: 'Response',
      agent: 'Response & Field Crew',
      desc: 'Field officers accept tasks, perform repairs, and post completion photos.',
      icon: CheckCircle2,
    },
  ];

  return (
    <AppShell breadcrumbs={[{ label: t.insights.title }]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#172033] dark:text-white">
              {t.insights.title}
            </h1>
            <p className="mt-1 text-sm text-[#64748B] dark:text-slate-400">
              {t.insights.subtitle}
            </p>
          </div>
          <p className="text-xs text-[#64748B] dark:text-slate-400">
            {aiMode === 'gemini'
              ? 'AI-Assisted Analysis · Computed from live complaint dataset'
              : 'Demo Rules Summary · Derived directly from the shared complaint dataset'}
          </p>
        </div>

        {/* Key Insights */}
        <section>
          <h2 className="text-base font-semibold text-[#172033] dark:text-white">
            {t.insights.keyInsights}
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
            {insights.map((ins) => {
              const metricColor =
                ins.tone === 'critical'
                  ? 'text-[#DC2626] dark:text-red-400'
                  : ins.tone === 'warning'
                  ? 'text-[#D97706] dark:text-amber-400'
                  : ins.tone === 'success'
                  ? 'text-[#16A34A] dark:text-emerald-400'
                  : 'text-[#4F46E5] dark:text-indigo-400';

              return (
                <article
                  key={ins.id}
                  className="rounded-xl border border-[#E5E7EB] bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-semibold text-[#172033] dark:text-white">
                      {ins.title}
                    </h3>
                    <span className={`font-mono text-xs font-semibold tabular-nums whitespace-nowrap ${metricColor}`}>
                      {ins.metric}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-[#64748B] dark:text-slate-400">
                    {ins.detail}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        {/* Actionable Recommendations */}
        <section className="rounded-xl border border-[#E5E7EB] bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E7EB] pb-4 dark:border-slate-800">
            <div>
              <h2 className="text-base font-semibold text-[#172033] dark:text-white">
                {t.insights.recommendations}
              </h2>
              <p className="mt-0.5 text-xs text-[#64748B] dark:text-slate-400">
                Actionable priorities based on {kpis.total} active dataset records ({kpis.pendingReview}{' '}
                pending review, {kpis.critical} critical).
              </p>
            </div>
            <Link
              to={role === 'admin' ? '/admin' : '/map'}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#4F46E5] hover:underline dark:text-indigo-400 whitespace-nowrap"
            >
              <span>{role === 'admin' ? 'Open Operations Queue' : 'Explore on Community Map'}</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-4 divide-y divide-[#E5E7EB] dark:divide-slate-800">
            {recommendations.map((rec, idx) => (
              <div
                key={rec.id}
                className="flex flex-col justify-between gap-2 py-4 first:pt-1 last:pb-0 sm:flex-row sm:items-center"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 font-mono text-xs font-semibold text-[#4F46E5] tabular-nums dark:text-indigo-400">
                    0{idx + 1}
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-[#172033] dark:text-white">
                      {rec.title}
                    </h3>
                    <p className="mt-0.5 text-xs leading-relaxed text-[#64748B] dark:text-slate-400">
                      {rec.detail}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 text-xs font-medium text-[#475569] dark:text-slate-300">
                  {rec.department}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Agent Workflow */}
        <section className="rounded-xl border border-[#E5E7EB] bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-[#172033] dark:text-white">
                {t.insights.workflowTitle}
              </h2>
              <p className="mt-1 text-xs text-[#64748B] dark:text-slate-400">
                {aiMode === 'gemini'
                  ? 'AI-Assisted Analysis — Every complaint passes through five structured stages before human review.'
                  : 'Simulated AI Workflow — Demonstrates five structured triage stages prior to mandatory human approval.'}
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[#64748B] dark:text-slate-400">
              <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Human-in-the-loop required</span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {workflowStages.map((stage) => {
              const Icon = stage.icon;
              return (
                <div
                  key={stage.num}
                  className="rounded-lg border border-[#E5E7EB] bg-[#F7F8FA]/70 p-4 dark:border-slate-800 dark:bg-slate-800/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-[#4F46E5] tabular-nums dark:text-indigo-400">
                      {stage.num}
                    </span>
                    <Icon className="h-4 w-4 text-[#64748B] dark:text-slate-400" aria-hidden="true" />
                  </div>
                  <h3 className="mt-2.5 text-sm font-semibold text-[#172033] dark:text-white">
                    {stage.title}
                  </h3>
                  <p className="mt-0.5 text-[11px] font-medium text-[#64748B] dark:text-slate-400">
                    {stage.agent}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-[#475569] dark:text-slate-300">
                    {stage.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
};
