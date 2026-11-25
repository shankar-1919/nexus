import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Plus, Search } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { useApp } from '../context/AppContext';
import { SeverityLabel, StatusLabel } from '../components/StatusIndicators';
import { CivicImage } from '../components/CivicImage';
import {
  ISSUE_CATEGORIES,
  filterAndSortComplaints,
  formatShortDate,
} from '../lib/workflow';

export const MyReportsPage: React.FC = () => {
  const { complaints, profile, t } = useApp();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');
  const [scope, setScope] = useState<'mine' | 'all'>('mine');

  const scopedComplaints = useMemo(() => {
    if (scope === 'all') return complaints;
    return complaints.filter(
      (c) =>
        c.submittedBy.toLowerCase().includes(profile.name.toLowerCase()) ||
        !c.isSeededDemo
    );
  }, [complaints, profile.name, scope]);

  const filtered = useMemo(
    () =>
      filterAndSortComplaints(scopedComplaints, {
        search,
        category,
        severity: 'All',
        status,
        sortBy: 'newest',
      }),
    [scopedComplaints, search, category, status]
  );

  return (
    <AppShell
      breadcrumbs={[{ label: t.nav.myReports }]}
      actions={
        <Link
          to="/report"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#4F46E5] px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#4338CA] whitespace-nowrap"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{t.citizen.reportBtn}</span>
        </Link>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#172033] dark:text-white">
              {t.nav.myReports}
            </h1>
            <p className="mt-1 text-sm text-[#64748B] dark:text-slate-400">
              Track complaint review status, assigned officers, and resolution timelines.
            </p>
          </div>

          <div className="inline-flex rounded-lg border border-[#E5E7EB] bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setScope('mine')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                scope === 'mine'
                  ? 'bg-[#EEF2FF] text-[#4F46E5] dark:bg-indigo-950/70 dark:text-indigo-300'
                  : 'text-[#64748B] hover:text-[#172033] dark:text-slate-400'
              }`}
            >
              Submitted by Me
            </button>
            <button
              type="button"
              onClick={() => setScope('all')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                scope === 'all'
                  ? 'bg-[#EEF2FF] text-[#4F46E5] dark:bg-indigo-950/70 dark:text-indigo-300'
                  : 'text-[#64748B] hover:text-[#172033] dark:text-slate-400'
              }`}
            >
              All Community ({complaints.length})
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-[#E5E7EB] bg-white p-4 sm:grid-cols-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#94A3B8]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.common.searchPlaceholder}
              aria-label="Search reports"
              className="w-full rounded-lg border border-[#E5E7EB] bg-white py-2 pr-3 pl-9 text-sm text-[#172033] focus:border-[#4F46E5] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filter by category"
            className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#172033] focus:border-[#4F46E5] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="All">{t.common.allCategories}</option>
            {ISSUE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Filter by status"
            className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#172033] focus:border-[#4F46E5] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="All">{t.common.allStatuses}</option>
            <option value="Awaiting Review">Awaiting Review</option>
            <option value="Approved">Approved</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {/* Report Cards */}
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-[#64748B] dark:text-slate-400">{t.common.noResults}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filtered.map((item) => (
              <Link
                key={item.id}
                to={`/complaints/${item.id}`}
                className="flex flex-col justify-between gap-4 rounded-xl border border-[#E5E7EB] bg-white p-5 transition-colors hover:border-[#CBD5E1] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
              >
                <div className="flex gap-4">
                  <CivicImage
                    src={item.photoUrl}
                    alt={`${item.category} report photo`}
                    fallbackLabel="No photo"
                    className="h-24 w-28 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 text-xs text-[#64748B] dark:text-slate-400">
                      <span className="font-mono font-semibold text-[#172033] dark:text-slate-200">
                        {item.id}
                      </span>
                      <span>{formatShortDate(item.submittedAt)}</span>
                    </div>
                    <h2 className="mt-1 text-base font-semibold text-[#172033] dark:text-white">
                      {item.category}
                    </h2>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#64748B] dark:text-slate-400">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E7EB] pt-3.5 dark:border-slate-800">
                  <div className="flex min-w-0 items-center gap-1.5 text-xs text-[#64748B] dark:text-slate-400">
                    <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">{item.location.address}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <SeverityLabel severity={item.severity} />
                    <StatusLabel status={item.status} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
};
