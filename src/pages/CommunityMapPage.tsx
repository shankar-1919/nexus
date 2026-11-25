import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { List, Map as MapIcon, MapPin, Search } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { useApp } from '../context/AppContext';
import { LeafletMap } from '../components/LeafletMap';
import { SeverityLabel, StatusLabel, getSeverityHex } from '../components/StatusIndicators';
import {
  ISSUE_CATEGORIES,
  filterAndSortComplaints,
  formatShortDate,
} from '../lib/workflow';

export const CommunityMapPage: React.FC = () => {
  const { complaints, t } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get('focus'));
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [severity, setSeverity] = useState('All');
  const [status, setStatus] = useState('All');
  const [hideResolved, setHideResolved] = useState(false);

  const filtered = useMemo(
    () =>
      filterAndSortComplaints(complaints, {
        search,
        category,
        severity,
        status,
        hideResolved,
        sortBy: 'newest',
      }),
    [complaints, search, category, severity, status, hideResolved]
  );

  return (
    <AppShell breadcrumbs={[{ label: t.map.title }]}>
      <div className="space-y-5">
        {/* Header + View Switcher */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#172033] dark:text-white">
              {t.map.title}
            </h1>
            <p className="mt-1 text-sm text-[#64748B] dark:text-slate-400">{t.map.subtitle}</p>
          </div>

          <div
            role="tablist"
            aria-label="Map view mode"
            className="inline-flex rounded-lg border border-[#E5E7EB] bg-white p-1 dark:border-slate-800 dark:bg-slate-900"
          >
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'map'}
              onClick={() => setViewMode('map')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                viewMode === 'map'
                  ? 'bg-[#EEF2FF] text-[#4F46E5] dark:bg-indigo-950/70 dark:text-indigo-300'
                  : 'text-[#64748B] hover:text-[#172033] dark:text-slate-400'
              }`}
            >
              <MapIcon className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t.map.mapView}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'list'}
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                viewMode === 'list'
                  ? 'bg-[#EEF2FF] text-[#4F46E5] dark:bg-indigo-950/70 dark:text-indigo-300'
                  : 'text-[#64748B] hover:text-[#172033] dark:text-slate-400'
              }`}
            >
              <List className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t.map.listView}</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="relative lg:col-span-2">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#94A3B8]"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.common.searchPlaceholder}
                aria-label="Search map locations or complaint IDs"
                className="w-full rounded-lg border border-[#E5E7EB] bg-white py-2 pr-3 pl-9 text-sm text-[#172033] focus:border-[#4F46E5] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Filter by category"
              className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#172033] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="All">{t.common.allCategories}</option>
              {ISSUE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              aria-label="Filter by severity"
              className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#172033] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="All">{t.common.allSeverities}</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              aria-label="Filter by status"
              className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#172033] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="All">{t.common.allStatuses}</option>
              <option value="Awaiting Review">Awaiting Review</option>
              <option value="Approved">Approved</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E7EB] pt-3 text-xs dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-4">
              <label className="inline-flex cursor-pointer items-center gap-2 text-[#475569] dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={hideResolved}
                  onChange={(e) => setHideResolved(e.target.checked)}
                  className="h-4 w-4 rounded border-[#CBD5E1] text-[#4F46E5] focus:ring-[#4F46E5]"
                />
                <span>{t.map.hideResolved}</span>
              </label>

              <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#64748B] dark:text-slate-400">
                {(['Low', 'Medium', 'High', 'Critical'] as const).map((sev) => (
                  <span key={sev} className="inline-flex items-center gap-1.5">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: getSeverityHex(sev) }}
                      aria-hidden="true"
                    />
                    <span>{sev}</span>
                  </span>
                ))}
              </div>
            </div>

            <span className="text-[11px] text-[#64748B] dark:text-slate-400">
              {t.map.demoNotice}
            </span>
          </div>
        </section>

        {/* Map View (with side list) or Full List View */}
        {viewMode === 'map' ? (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <LeafletMap
                complaints={filtered}
                selectedId={selectedId}
                onSelectComplaint={setSelectedId}
                onOpenComplaint={(cid) => navigate(`/complaints/${cid}`)}
                heightClass="h-[520px]"
              />
            </div>

            <aside className="flex max-h-[520px] flex-col overflow-hidden rounded-xl border border-[#E5E7EB] bg-white lg:col-span-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-[#E5E7EB] px-4 py-3 text-xs font-semibold text-[#172033] dark:border-slate-800 dark:text-slate-100">
                Showing {filtered.length} report{filtered.length === 1 ? '' : 's'}
              </div>
              <div className="flex-1 divide-y divide-[#E5E7EB] overflow-y-auto dark:divide-slate-800">
                {filtered.length === 0 ? (
                  <p className="p-6 text-center text-xs text-[#64748B] dark:text-slate-400">
                    {t.common.noResults}
                  </p>
                ) : (
                  filtered.map((c) => {
                    const active = c.id === selectedId;
                    return (
                      <div
                        key={c.id}
                        className={`p-4 transition-colors ${
                          active
                            ? 'bg-[#EEF2FF]/60 dark:bg-indigo-950/30'
                            : 'hover:bg-[#F7F8FA] dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedId(c.id)}
                          className="w-full text-left"
                        >
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="font-mono font-semibold text-[#172033] dark:text-slate-200">
                              {c.id}
                            </span>
                            <SeverityLabel severity={c.severity} />
                          </div>
                          <p className="mt-1 text-sm font-semibold text-[#172033] dark:text-white">
                            {c.category}
                          </p>
                          <p className="mt-1 flex items-center gap-1 text-xs text-[#64748B] dark:text-slate-400">
                            <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                            <span className="truncate">{c.location.address}</span>
                          </p>
                        </button>
                        <div className="mt-2.5 flex items-center justify-between gap-2">
                          <StatusLabel status={c.status} />
                          <Link
                            to={`/complaints/${c.id}`}
                            className="text-xs font-medium text-[#4F46E5] hover:underline dark:text-indigo-400"
                          >
                            {t.common.viewDetails}
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </aside>
          </div>
        ) : (
          <section className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white dark:border-slate-800 dark:bg-slate-900">
            {filtered.length === 0 ? (
              <p className="p-8 text-center text-sm text-[#64748B] dark:text-slate-400">
                {t.common.noResults}
              </p>
            ) : (
              <div className="divide-y divide-[#E5E7EB] dark:divide-slate-800">
                {filtered.map((c) => (
                  <Link
                    key={c.id}
                    to={`/complaints/${c.id}`}
                    className="flex flex-col justify-between gap-3 px-6 py-4 transition-colors hover:bg-[#F7F8FA] sm:flex-row sm:items-center dark:hover:bg-slate-800/50"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs text-[#64748B] dark:text-slate-400">
                        <span className="font-mono font-semibold text-[#172033] dark:text-slate-200">
                          {c.id}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{formatShortDate(c.submittedAt)}</span>
                        {c.isSeededDemo && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>Demo data</span>
                          </>
                        )}
                      </div>
                      <h2 className="mt-1 text-sm font-semibold text-[#172033] dark:text-white">
                        {c.category} — {c.location.area}
                      </h2>
                      <p className="mt-0.5 truncate text-xs text-[#64748B] dark:text-slate-400">
                        {c.location.address}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-4">
                      <SeverityLabel severity={c.severity} />
                      <StatusLabel status={c.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </AppShell>
  );
};
