import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Info, MapPin, Plus } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { useApp } from '../context/AppContext';
import { SeverityLabel, StatusLabel } from '../components/StatusIndicators';
import { computeDashboardKPIs, formatShortDate } from '../lib/workflow';
import { getGreeting } from '../lib/i18n';

export const CitizenDashboardPage: React.FC = () => {
  const { complaints, profile, preferences, t } = useApp();

  const myReports = useMemo(
    () =>
      complaints.filter(
        (c) =>
          c.submittedBy.toLowerCase().includes(profile.name.toLowerCase()) ||
          !c.isSeededDemo
      ),
    [complaints, profile.name]
  );

  const myKpis = useMemo(() => computeDashboardKPIs(myReports), [myReports]);
  const recentCommunity = useMemo(() => complaints.slice(0, 5), [complaints]);

  return (
    <AppShell breadcrumbs={[{ label: t.nav.overview }]}>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <section className="flex flex-col justify-between gap-5 rounded-xl border border-[#E5E7EB] bg-white p-6 sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#172033] sm:text-[28px] dark:text-white">
              {getGreeting(preferences.language)}
            </h1>
            <p className="mt-1.5 text-sm text-[#64748B] dark:text-slate-400">
              {t.citizen.subtitle}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/report"
              className="inline-flex items-center gap-2 rounded-lg bg-[#4F46E5] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#4338CA] whitespace-nowrap"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>{t.citizen.reportBtn}</span>
            </Link>
            <Link
              to="/my-reports"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-medium text-[#172033] transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 whitespace-nowrap"
            >
              <span>{t.citizen.viewMyReports}</span>
            </Link>
          </div>
        </section>

        {/* Overview KPI Cards */}
        <section aria-label="Your report summary" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: t.citizen.reportsSubmitted, value: myKpis.submitted, sub: 'Your submissions' },
            { label: t.citizen.underReview, value: myKpis.pendingReview, sub: 'Awaiting verification' },
            { label: t.citizen.inProgress, value: myKpis.activeAssignments, sub: 'Assigned or active' },
            { label: t.citizen.resolved, value: myKpis.resolved, sub: 'Completed repairs' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-[#E5E7EB] bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            >
              <p className="text-xs font-medium text-[#64748B] dark:text-slate-400">{stat.label}</p>
              <p className="mt-2 font-mono text-2xl font-semibold text-[#172033] tabular-nums dark:text-white">
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-[#64748B] dark:text-slate-400">{stat.sub}</p>
            </div>
          ))}
        </section>

        {/* Main 2-Column Content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Recent Reports */}
          <section className="rounded-xl border border-[#E5E7EB] bg-white lg:col-span-7 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-4 dark:border-slate-800">
              <h2 className="text-base font-semibold text-[#172033] dark:text-white">
                {t.citizen.recentReports}
              </h2>
              <Link
                to="/my-reports"
                className="inline-flex items-center gap-1 text-xs font-medium text-[#4F46E5] hover:underline dark:text-indigo-400 whitespace-nowrap"
              >
                <span>View all</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>

            {myReports.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-[#64748B] dark:text-slate-400">
                  You have not submitted any reports yet.
                </p>
                <Link
                  to="/report"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#4F46E5] px-4 py-2 text-sm font-medium text-white hover:bg-[#4338CA]"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  <span>Report your first issue</span>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-[#E5E7EB] dark:divide-slate-800">
                {myReports.slice(0, 5).map((item) => (
                  <Link
                    key={item.id}
                    to={`/complaints/${item.id}`}
                    className="block px-6 py-4 transition-colors hover:bg-[#F7F8FA] dark:hover:bg-slate-800/50"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs text-[#64748B] dark:text-slate-400">
                        <span className="font-mono font-medium text-[#172033] dark:text-slate-200">
                          {item.id}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{formatShortDate(item.submittedAt)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <SeverityLabel severity={item.severity} />
                        <StatusLabel status={item.status} />
                      </div>
                    </div>
                    <h3 className="mt-1.5 text-sm font-semibold text-[#172033] dark:text-white">
                      {item.category}
                    </h3>
                    <p className="mt-1 line-clamp-1 text-sm text-[#64748B] dark:text-slate-400">
                      {item.description}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-[#64748B] dark:text-slate-400">
                      <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span className="truncate">{item.location.address}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Right Column: Community Updates + Helpful Card */}
          <div className="space-y-6 lg:col-span-5">
            <section className="rounded-xl border border-[#E5E7EB] bg-white dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-4 dark:border-slate-800">
                <h2 className="text-base font-semibold text-[#172033] dark:text-white">
                  {t.citizen.communityUpdates}
                </h2>
                <Link
                  to="/map"
                  className="text-xs font-medium text-[#4F46E5] hover:underline dark:text-indigo-400 whitespace-nowrap"
                >
                  Open map
                </Link>
              </div>
              <div className="divide-y divide-[#E5E7EB] dark:divide-slate-800">
                {recentCommunity.map((item) => (
                  <Link
                    key={item.id}
                    to={`/complaints/${item.id}`}
                    className="flex items-center justify-between gap-3 px-6 py-3.5 transition-colors hover:bg-[#F7F8FA] dark:hover:bg-slate-800/50"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#172033] dark:text-slate-100">
                        {item.category}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-[#64748B] dark:text-slate-400">
                        {item.location.area} · {formatShortDate(item.submittedAt)}
                      </p>
                    </div>
                    <StatusLabel status={item.status} />
                  </Link>
                ))}
              </div>
            </section>

            {/* Helpful Section */}
            <section className="rounded-xl border border-[#E5E7EB] bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#4F46E5] dark:bg-indigo-950/70 dark:text-indigo-400">
                  <Info className="h-4.5 w-4.5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-[#172033] dark:text-white">
                    {t.citizen.helpfulTitle}
                  </h2>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#64748B] dark:text-slate-400">
                    {t.citizen.helpfulBody}
                  </p>
                  <ol className="mt-3 space-y-1.5 text-xs text-[#475569] dark:text-slate-300">
                    <li>1. Submit location and optional photo.</li>
                    <li>2. Automated triage suggests priority and department.</li>
                    <li>3. Municipal coordinator approves and assigns a field officer.</li>
                    <li>4. Track progress until completion evidence is posted.</li>
                  </ol>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
};
