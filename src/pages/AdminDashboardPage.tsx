import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowUpDown, CheckCircle2, Search, ShieldCheck, UserCheck } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { useApp } from '../context/AppContext';
import { SeverityLabel, StatusLabel, getSeverityHex } from '../components/StatusIndicators';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { CivicImage } from '../components/CivicImage';
import {
  DEPARTMENTS,
  FIELD_OFFICERS,
  ISSUE_CATEGORIES,
  computeAnalytics,
  computeDashboardKPIs,
  filterAndSortComplaints,
  formatShortDate,
} from '../lib/workflow';
import type { Complaint, Department, Severity } from '../types/complaint';

export const AdminDashboardPage: React.FC = () => {
  const { complaints, approveComplaint, rejectComplaint, assignComplaint, pushToast, t } = useApp();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'analytics'>('all');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [severity, setSeverity] = useState('All');
  const [status, setStatus] = useState('All');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'severity'>('newest');

  // Quick modal states
  const [reviewTarget, setReviewTarget] = useState<Complaint | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [reviewReason, setReviewReason] = useState('');

  const [assignTarget, setAssignTarget] = useState<Complaint | null>(null);
  const [selectedOfficer, setSelectedOfficer] = useState(FIELD_OFFICERS[0].name);
  const [selectedDept, setSelectedDept] = useState<Department>(DEPARTMENTS[0]);
  const [busy, setBusy] = useState(false);

  const kpis = useMemo(() => computeDashboardKPIs(complaints), [complaints]);
  const analytics = useMemo(() => computeAnalytics(complaints), [complaints]);

  const filtered = useMemo(
    () =>
      filterAndSortComplaints(complaints, {
        search,
        category,
        severity,
        status,
        sortBy,
      }),
    [complaints, search, category, severity, status, sortBy]
  );

  const pendingQueue = useMemo(
    () => complaints.filter((c) => c.status === 'Awaiting Review'),
    [complaints]
  );

  const openAssignModal = (c: Complaint) => {
    setAssignTarget(c);
    setSelectedDept(c.department);
    const matchingOfficer =
      FIELD_OFFICERS.find((o) => o.department === c.department)?.name ?? FIELD_OFFICERS[0].name;
    setSelectedOfficer(c.assignedOfficer || matchingOfficer);
  };

  const handleConfirmReview = async () => {
    if (!reviewTarget || !reviewAction) return;
    setBusy(true);
    try {
      if (reviewAction === 'approve') {
        await approveComplaint(reviewTarget.id, {
          severity: reviewTarget.severity,
          department: reviewTarget.department,
        });
      } else {
        await rejectComplaint(
          reviewTarget.id,
          reviewReason.trim() || 'Rejected during administrative review.'
        );
      }
      setReviewTarget(null);
      setReviewAction(null);
      setReviewReason('');
    } catch (err) {
      pushToast('Action failed', err instanceof Error ? err.message : 'Unable to update report', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmAssign = async () => {
    if (!assignTarget) return;
    setBusy(true);
    try {
      await assignComplaint(assignTarget.id, {
        officer: selectedOfficer,
        department: selectedDept,
      });
      setAssignTarget(null);
    } catch (err) {
      pushToast('Assignment failed', err instanceof Error ? err.message : 'Unable to assign', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell breadcrumbs={[{ label: t.admin.title }]}>
      <div className="space-y-6">
        {/* Header & Section Tabs */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#172033] sm:text-[28px] dark:text-white">
              {t.admin.title}
            </h1>
            <p className="mt-1 text-sm text-[#64748B] dark:text-slate-400">{t.admin.subtitle}</p>
          </div>

          <div
            role="tablist"
            aria-label="Operations dashboard sections"
            className="inline-flex rounded-lg border border-[#E5E7EB] bg-white p-1 dark:border-slate-800 dark:bg-slate-900"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'all'}
              onClick={() => setActiveTab('all')}
              className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-[#EEF2FF] text-[#4F46E5] dark:bg-indigo-950/70 dark:text-indigo-300'
                  : 'text-[#64748B] hover:text-[#172033] dark:text-slate-400'
              }`}
            >
              {t.admin.tabAll} ({kpis.total})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'pending'}
              onClick={() => setActiveTab('pending')}
              className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === 'pending'
                  ? 'bg-[#EEF2FF] text-[#4F46E5] dark:bg-indigo-950/70 dark:text-indigo-300'
                  : 'text-[#64748B] hover:text-[#172033] dark:text-slate-400'
              }`}
            >
              {t.admin.tabPending} ({kpis.pendingReview})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'analytics'}
              onClick={() => setActiveTab('analytics')}
              className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === 'analytics'
                  ? 'bg-[#EEF2FF] text-[#4F46E5] dark:bg-indigo-950/70 dark:text-indigo-300'
                  : 'text-[#64748B] hover:text-[#172033] dark:text-slate-400'
              }`}
            >
              {t.admin.tabAnalytics}
            </button>
          </div>
        </div>

        {/* 5 KPI Cards */}
        <section aria-label="Operations metrics" className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { label: t.admin.totalReports, value: kpis.total, accent: 'text-[#172033] dark:text-white' },
            { label: t.admin.pendingReview, value: kpis.pendingReview, accent: 'text-[#D97706] dark:text-amber-400' },
            { label: t.admin.criticalIssues, value: kpis.critical, accent: 'text-[#DC2626] dark:text-red-400' },
            { label: t.admin.activeAssignments, value: kpis.activeAssignments, accent: 'text-[#4F46E5] dark:text-indigo-400' },
            { label: t.admin.resolvedReports, value: kpis.resolved, accent: 'text-[#16A34A] dark:text-emerald-400' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-[#E5E7EB] bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            >
              <p className="text-xs font-medium text-[#64748B] dark:text-slate-400">{stat.label}</p>
              <p className={`mt-2 font-mono text-2xl font-semibold tabular-nums ${stat.accent}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </section>

        {/* TAB 1: ALL REPORTS TABLE */}
        {activeTab === 'all' && (
          <section className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white dark:border-slate-800 dark:bg-slate-900">
            {/* Toolbar */}
            <div className="grid grid-cols-1 gap-3 border-b border-[#E5E7EB] p-4 sm:grid-cols-2 lg:grid-cols-6 dark:border-slate-800">
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
                  aria-label="Search operations table"
                  className="w-full rounded-lg border border-[#E5E7EB] bg-white py-2 pr-3 pl-9 text-sm text-[#172033] focus:border-[#4F46E5] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                aria-label="Filter by category"
                className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-medium text-[#172033] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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
                className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-medium text-[#172033] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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
                className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-medium text-[#172033] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="All">{t.common.allStatuses}</option>
                <option value="Awaiting Review">Awaiting Review</option>
                <option value="Approved">Approved</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Rejected">Rejected</option>
              </select>

              <div className="relative flex items-center">
                <ArrowUpDown
                  className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-[#94A3B8]"
                  aria-hidden="true"
                />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'severity')}
                  aria-label="Sort complaints"
                  className="w-full rounded-lg border border-[#E5E7EB] bg-white py-2 pr-3 pl-8 text-xs font-medium text-[#172033] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="newest">Sort: Newest</option>
                  <option value="severity">Sort: Highest Severity</option>
                  <option value="oldest">Sort: Oldest</option>
                </select>
              </div>
            </div>

            {/* Responsive Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F7F8FA] text-xs font-medium text-[#64748B] dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                    <th className="px-4 py-3">Complaint ID</th>
                    <th className="px-4 py-3">Issue</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Severity</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Assigned Officer</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] dark:divide-slate-800">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-sm text-[#64748B]">
                        {t.common.noResults}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((item) => (
                      <tr
                        key={item.id}
                        className="transition-colors hover:bg-[#F7F8FA] dark:hover:bg-slate-800/40"
                      >
                        <td className="px-4 py-3.5 font-mono text-xs font-semibold text-[#172033] tabular-nums dark:text-slate-200">
                          <Link
                            to={`/complaints/${item.id}`}
                            className="hover:text-[#4F46E5] hover:underline"
                          >
                            {item.id}
                          </Link>
                        </td>
                        <td className="px-4 py-3.5">
                          <Link
                            to={`/complaints/${item.id}`}
                            className="font-medium text-[#172033] hover:text-[#4F46E5] dark:text-white"
                          >
                            {item.category}
                          </Link>
                          <div className="max-w-[200px] truncate text-xs text-[#64748B] dark:text-slate-400">
                            {item.department}
                          </div>
                        </td>
                        <td className="max-w-[190px] truncate px-4 py-3.5 text-xs text-[#475569] dark:text-slate-300">
                          {item.location.area}
                        </td>
                        <td className="px-4 py-3.5">
                          <SeverityLabel severity={item.severity} />
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs text-[#64748B] tabular-nums dark:text-slate-400">
                          {formatShortDate(item.submittedAt)}
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusLabel status={item.status} />
                        </td>
                        <td className="px-4 py-3.5 text-xs text-[#475569] dark:text-slate-300">
                          {item.assignedOfficer || 'Unassigned'}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="inline-flex items-center justify-end gap-2">
                            {item.status === 'Awaiting Review' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setReviewTarget(item);
                                  setReviewAction('approve');
                                }}
                                className="rounded-md bg-[#4F46E5] px-2.5 py-1 text-xs font-medium text-white hover:bg-[#4338CA] whitespace-nowrap"
                              >
                                Approve
                              </button>
                            )}
                            {(item.status === 'Approved' || item.status === 'Assigned') && (
                              <button
                                type="button"
                                onClick={() => openAssignModal(item)}
                                className="rounded-md border border-[#E5E7EB] bg-white px-2.5 py-1 text-xs font-medium text-[#172033] hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 whitespace-nowrap"
                              >
                                {item.assignedOfficer ? 'Reassign' : 'Assign'}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => navigate(`/complaints/${item.id}`)}
                              className="text-xs font-medium text-[#4F46E5] hover:underline dark:text-indigo-400 whitespace-nowrap"
                            >
                              Open
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* TAB 2: PENDING HUMAN REVIEW QUEUE */}
        {activeTab === 'pending' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-[#172033] dark:text-white">
                  Human Approval Queue
                </h2>
                <p className="text-xs text-[#64748B] dark:text-slate-400">
                  AI recommendations never dispatch crews automatically. Review each report below before approving.
                </p>
              </div>
            </div>

            {pendingQueue.length === 0 ? (
              <div className="rounded-xl border border-[#E5E7EB] bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
                <CheckCircle2 className="mx-auto h-8 w-8 text-[#16A34A]" aria-hidden="true" />
                <p className="mt-3 text-sm font-semibold text-[#172033] dark:text-white">
                  All submitted reports have been reviewed
                </p>
                <p className="mt-1 text-xs text-[#64748B] dark:text-slate-400">
                  New citizen submissions will appear here after triage completes.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {pendingQueue.map((item) => (
                  <article
                    key={item.id}
                    className="flex flex-col justify-between rounded-xl border border-[#E5E7EB] bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-mono text-xs font-semibold text-[#64748B] dark:text-slate-400">
                            {item.id} · {formatShortDate(item.submittedAt)}
                          </div>
                          <h3 className="mt-1 text-base font-semibold text-[#172033] dark:text-white">
                            {item.category} — {item.location.area}
                          </h3>
                        </div>
                        <SeverityLabel severity={item.severity} />
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-12">
                        <div className="sm:col-span-5">
                          <CivicImage
                            src={item.photoUrl}
                            alt={`${item.category} report photo`}
                            className="h-36 w-full"
                          />
                        </div>
                        <div className="space-y-2 text-xs sm:col-span-7">
                          <p className="leading-relaxed text-[#334155] dark:text-slate-300">
                            {item.description}
                          </p>
                          <div className="rounded-lg bg-[#F7F8FA] p-3 dark:bg-slate-800/60">
                            <p className="font-semibold text-[#172033] dark:text-white">
                              AI Recommendation ({item.aiAnalysis.mode === 'gemini' ? 'Gemini' : 'Demo Rules'})
                            </p>
                            <p className="mt-1 text-[#475569] dark:text-slate-300">
                              Dept: {item.aiAnalysis.department}
                            </p>
                            <p className="mt-0.5 text-[#475569] dark:text-slate-300">
                              Action: {item.aiAnalysis.recommendedAction}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-[#E5E7EB] pt-4 dark:border-slate-800">
                      <Link
                        to={`/complaints/${item.id}`}
                        className="text-xs font-medium text-[#4F46E5] hover:underline dark:text-indigo-400"
                      >
                        Full Assessment & Edit Priority
                      </Link>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setReviewTarget(item);
                            setReviewAction('reject');
                          }}
                          className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-[#DC2626] hover:bg-red-50 dark:border-red-900/60 dark:bg-slate-900 dark:text-red-400 whitespace-nowrap"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setReviewTarget(item);
                            setReviewAction('approve');
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#4F46E5] px-3.5 py-1.5 text-xs font-medium text-white hover:bg-[#4338CA] whitespace-nowrap"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Approve Report</span>
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 3: RECHARTS ANALYTICS */}
        {activeTab === 'analytics' && (
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Reports by Category */}
            <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-sm font-semibold text-[#172033] dark:text-white">
                Reports by Category
              </h2>
              <p className="mt-0.5 text-xs text-[#64748B] dark:text-slate-400">
                Volume across infrastructure categories
              </p>
              <div className="mt-4 h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.byCategory} margin={{ top: 8, right: 12, left: -16, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} interval={0} angle={-15} textAnchor="end" height={48} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Reports" fill="#4F46E5" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Reports by Status */}
            <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-sm font-semibold text-[#172033] dark:text-white">
                Reports by Status
              </h2>
              <p className="mt-0.5 text-xs text-[#64748B] dark:text-slate-400">
                Workflow distribution from triage to resolution
              </p>
              <div className="mt-4 h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.byStatus} margin={{ top: 8, right: 12, left: -16, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Complaints" fill="#0891B2" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Severity Distribution */}
            <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-sm font-semibold text-[#172033] dark:text-white">
                Severity Distribution
              </h2>
              <p className="mt-0.5 text-xs text-[#64748B] dark:text-slate-400">
                Breakdown by assigned urgency level
              </p>
              <div className="mt-4 grid grid-cols-1 items-center gap-4 sm:grid-cols-2">
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.bySeverity}
                        dataKey="count"
                        nameKey="name"
                        innerRadius={52}
                        outerRadius={82}
                        paddingAngle={3}
                        isAnimationActive={false}
                      >
                        {analytics.bySeverity.map((entry) => (
                          <Cell key={entry.name} fill={getSeverityHex(entry.name as Severity)} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="space-y-2.5 text-xs">
                  {analytics.bySeverity.map((entry) => (
                    <li key={entry.name} className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 text-[#475569] dark:text-slate-300">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: getSeverityHex(entry.name as Severity) }}
                        />
                        <span>{entry.name}</span>
                      </span>
                      <span className="font-mono font-semibold text-[#172033] tabular-nums dark:text-white">
                        {entry.count}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Resolution Trend */}
            <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-sm font-semibold text-[#172033] dark:text-white">
                Resolution Trend
              </h2>
              <p className="mt-0.5 text-xs text-[#64748B] dark:text-slate-400">
                Reported vs resolved incidents by date
              </p>
              <div className="mt-4 h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.resolutionTrend} margin={{ top: 8, right: 12, left: -16, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="reported"
                      name="Reported"
                      stroke="#4F46E5"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      isAnimationActive={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="resolved"
                      name="Resolved"
                      stroke="#16A34A"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Approve / Reject Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(reviewTarget && reviewAction)}
        title={
          reviewAction === 'approve'
            ? `Approve ${reviewTarget?.id}?`
            : `Reject ${reviewTarget?.id}?`
        }
        description={
          reviewAction === 'approve'
            ? `Confirm human review approval for ${reviewTarget?.category} (${reviewTarget?.severity} priority) and move into officer assignment.`
            : `Confirm rejection of ${reviewTarget?.id}. The reason will be recorded in the complaint timeline.`
        }
        confirmLabel={reviewAction === 'approve' ? 'Approve Report' : 'Reject Report'}
        variant={reviewAction === 'reject' ? 'danger' : 'primary'}
        loading={busy}
        onConfirm={handleConfirmReview}
        onCancel={() => {
          setReviewTarget(null);
          setReviewAction(null);
          setReviewReason('');
        }}
      >
        {reviewAction === 'reject' && (
          <div>
            <label
              htmlFor="quick-reject-reason"
              className="block text-xs font-medium text-[#475569] dark:text-slate-300"
            >
              Reason for rejection
            </label>
            <textarea
              id="quick-reject-reason"
              rows={2}
              value={reviewReason}
              onChange={(e) => setReviewReason(e.target.value)}
              placeholder="Explain why this report is being rejected..."
              className="mt-1.5 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#172033] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
        )}
      </ConfirmDialog>

      {/* Quick Assign Officer Dialog */}
      <ConfirmDialog
        open={Boolean(assignTarget)}
        title={`Assign Field Officer — ${assignTarget?.id ?? ''}`}
        description="Choose the responsible department and field officer to handle this incident."
        confirmLabel="Confirm Assignment"
        loading={busy}
        onConfirm={handleConfirmAssign}
        onCancel={() => setAssignTarget(null)}
      >
        <div className="space-y-3">
          <div>
            <label
              htmlFor="modal-dept"
              className="block text-xs font-medium text-[#475569] dark:text-slate-300"
            >
              Department
            </label>
            <select
              id="modal-dept"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value as Department)}
              className="mt-1 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#172033] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="modal-officer"
              className="block text-xs font-medium text-[#475569] dark:text-slate-300"
            >
              Field Officer
            </label>
            <select
              id="modal-officer"
              value={selectedOfficer}
              onChange={(e) => setSelectedOfficer(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#172033] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {FIELD_OFFICERS.map((off) => (
                <option key={off.id} value={off.name}>
                  {off.name} ({off.zone})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#64748B] dark:text-slate-400">
            <UserCheck className="h-3.5 w-3.5 text-[#4F46E5]" aria-hidden="true" />
            <span>Task will immediately appear in Field Officer view.</span>
          </div>
        </div>
      </ConfirmDialog>
    </AppShell>
  );
};
