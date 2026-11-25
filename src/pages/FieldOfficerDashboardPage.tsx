import React, { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  CheckCircle2,
  MapPin,
  Play,
  Upload,
  UserCheck,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { useApp } from '../context/AppContext';
import { SeverityLabel, StatusLabel } from '../components/StatusIndicators';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { CivicImage } from '../components/CivicImage';
import { FIELD_OFFICERS } from '../lib/workflow';
import type { Complaint } from '../types/complaint';

export const FieldOfficerDashboardPage: React.FC = () => {
  const {
    complaints,
    activeOfficerName,
    setActiveOfficerName,
    updateTaskStatus,
    resolveComplaint,
    uploadImage,
    pushToast,
    t,
  } = useApp();

  const [officerFilter, setOfficerFilter] = useState<'all' | string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'progress' | 'completed'>('all');

  // Resolve modal state
  const [resolveTarget, setResolveTarget] = useState<Complaint | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [completionPhotoUrl, setCompletionPhotoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const assignedTasks = useMemo(() => {
    return complaints.filter((c) => {
      if (!c.assignedOfficer) return false;
      if (officerFilter !== 'all' && c.assignedOfficer !== officerFilter) return false;
      return true;
    });
  }, [complaints, officerFilter]);

  const counts = useMemo(() => {
    const newTasks = assignedTasks.filter((c) => c.status === 'Assigned').length;
    const inProgress = assignedTasks.filter(
      (c) => c.status === 'Accepted' || c.status === 'In Progress'
    ).length;
    const completed = assignedTasks.filter((c) => c.status === 'Resolved').length;
    return {
      total: assignedTasks.length,
      newTasks,
      inProgress,
      completed,
    };
  }, [assignedTasks]);

  const visibleTasks = useMemo(() => {
    return assignedTasks.filter((c) => {
      if (statusFilter === 'new') return c.status === 'Assigned';
      if (statusFilter === 'progress') return c.status === 'Accepted' || c.status === 'In Progress';
      if (statusFilter === 'completed') return c.status === 'Resolved';
      return true;
    });
  }, [assignedTasks, statusFilter]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setCompletionPhotoUrl(url);
    } catch (err) {
      pushToast('Upload failed', err instanceof Error ? err.message : 'Unable to upload photo', 'error');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleConfirmResolve = async () => {
    if (!resolveTarget) return;
    if (!resolutionNote.trim()) {
      pushToast('Resolution note required', 'Please enter details of the completed repair.', 'error');
      return;
    }
    setBusy(true);
    try {
      await resolveComplaint(resolveTarget.id, {
        note: resolutionNote.trim(),
        completionPhotoUrl: completionPhotoUrl || undefined,
      });
      setResolveTarget(null);
      setResolutionNote('');
      setCompletionPhotoUrl('');
    } catch (err) {
      pushToast('Action failed', err instanceof Error ? err.message : 'Unable to resolve task', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell breadcrumbs={[{ label: t.officer.title }]}>
      <div className="space-y-6">
        {/* Header + Officer Selector */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#172033] sm:text-[28px] dark:text-white">
              {t.officer.title}
            </h1>
            <p className="mt-1 text-sm text-[#64748B] dark:text-slate-400">{t.officer.subtitle}</p>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="officer-view-select" className="text-xs font-medium text-[#64748B] dark:text-slate-400 whitespace-nowrap">
              Viewing tasks for:
            </label>
            <select
              id="officer-view-select"
              value={officerFilter}
              onChange={(e) => {
                const val = e.target.value;
                setOfficerFilter(val);
                if (val !== 'all') setActiveOfficerName(val);
              }}
              className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-medium text-[#172033] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="all">All Field Officers (Demo)</option>
              {FIELD_OFFICERS.map((off) => (
                <option key={off.id} value={off.name}>
                  {off.name} ({off.department.split(' ')[0]})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Interactive Summary Filter Cards */}
        <section aria-label="Task counts" className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
          {(
            [
              { id: 'all', label: t.officer.assignedTasks, value: counts.total },
              { id: 'new', label: t.officer.newTasks, value: counts.newTasks },
              { id: 'progress', label: t.officer.inProgress, value: counts.inProgress },
              { id: 'completed', label: t.officer.completed, value: counts.completed },
            ] as const
          ).map((card) => {
            const active = statusFilter === card.id;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => setStatusFilter(card.id)}
                aria-pressed={active}
                className={`rounded-xl border p-4 text-left transition-colors ${
                  active
                    ? 'border-[#4F46E5] bg-[#EEF2FF]/60 dark:border-indigo-500 dark:bg-indigo-950/40'
                    : 'border-[#E5E7EB] bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                }`}
              >
                <div className="text-xs font-medium text-[#64748B] dark:text-slate-400">
                  {card.label}
                </div>
                <div className="mt-1.5 font-mono text-2xl font-semibold text-[#172033] tabular-nums dark:text-white">
                  {card.value}
                </div>
              </button>
            );
          })}
        </section>

        {/* Task Cards */}
        {visibleTasks.length === 0 ? (
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-[#172033] dark:text-white">
              No field tasks match this filter.
            </p>
            <p className="mt-1 text-xs text-[#64748B] dark:text-slate-400">
              Switch to Administrator to approve and assign a pending report, or change the officer filter above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {visibleTasks.map((task) => (
              <article
                key={task.id}
                className="flex flex-col justify-between rounded-xl border border-[#E5E7EB] bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-[#64748B] dark:text-slate-400">
                      <span className="font-mono font-semibold text-[#172033] dark:text-slate-200">
                        {task.id}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{task.assignedOfficer}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <SeverityLabel severity={task.severity} />
                      <StatusLabel status={task.status} />
                    </div>
                  </div>

                  <h2 className="mt-2 text-base font-semibold text-[#172033] dark:text-white">
                    {task.category}
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-[#475569] dark:text-slate-300">
                    {task.description}
                  </p>

                  <dl className="mt-4 grid grid-cols-1 gap-2.5 border-t border-[#E5E7EB] pt-3.5 text-xs sm:grid-cols-2 dark:border-slate-800">
                    <div className="flex items-start gap-1.5 text-[#475569] dark:text-slate-300">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#4F46E5]" aria-hidden="true" />
                      <span>{task.location.address}</span>
                    </div>
                    <div className="space-y-1 text-[#475569] dark:text-slate-300">
                      <div>Dept: {task.department}</div>
                      {task.dueDate && (
                        <div className="inline-flex items-center gap-1 font-mono text-[11px] text-[#64748B] dark:text-slate-400">
                          <Calendar className="h-3 w-3" aria-hidden="true" />
                          <span>Due {task.dueDate}</span>
                        </div>
                      )}
                    </div>
                  </dl>

                  {task.instructions && (
                    <div className="mt-3 rounded-lg bg-[#F7F8FA] px-3 py-2 text-xs text-[#475569] dark:bg-slate-800/60 dark:text-slate-300">
                      <span className="font-semibold text-[#172033] dark:text-slate-100">
                        Instructions:{' '}
                      </span>
                      {task.instructions}
                    </div>
                  )}
                </div>

                {/* Action Bar */}
                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[#E5E7EB] pt-4 dark:border-slate-800">
                  {task.status === 'Assigned' && (
                    <button
                      type="button"
                      onClick={() => void updateTaskStatus(task.id, 'Accepted')}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#4F46E5] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#4338CA] whitespace-nowrap"
                    >
                      <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Accept Task</span>
                    </button>
                  )}

                  {(task.status === 'Assigned' || task.status === 'Accepted') && (
                    <button
                      type="button"
                      onClick={() => void updateTaskStatus(task.id, 'In Progress')}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#0891B2] px-3.5 py-2 text-xs font-medium text-white hover:bg-cyan-700 whitespace-nowrap"
                    >
                      <Play className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Start Work</span>
                    </button>
                  )}

                  {task.status !== 'Resolved' && (
                    <button
                      type="button"
                      onClick={() => {
                        setResolveTarget(task);
                        setResolutionNote('');
                        setCompletionPhotoUrl('');
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#16A34A] px-3.5 py-2 text-xs font-medium text-white hover:bg-emerald-700 whitespace-nowrap"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Mark Resolved</span>
                    </button>
                  )}

                  <Link
                    to={`/map?focus=${task.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-medium text-[#172033] hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 whitespace-nowrap"
                  >
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>View Location</span>
                  </Link>

                  <Link
                    to={`/complaints/${task.id}`}
                    className="ml-auto text-xs font-medium text-[#4F46E5] hover:underline dark:text-indigo-400 whitespace-nowrap"
                  >
                    Details
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Resolve Task Modal */}
      <ConfirmDialog
        open={Boolean(resolveTarget)}
        title={`Resolve Task ${resolveTarget?.id ?? ''}`}
        description={`Submit completion details and photo evidence for ${resolveTarget?.category ?? 'this incident'} (acting as ${activeOfficerName}).`}
        confirmLabel="Confirm Resolution"
        loading={busy}
        onConfirm={handleConfirmResolve}
        onCancel={() => setResolveTarget(null)}
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="task-resolve-note"
              className="block text-xs font-medium text-[#475569] dark:text-slate-300"
            >
              Resolution Note (required)
            </label>
            <textarea
              id="task-resolve-note"
              rows={3}
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="Summarize the work performed and confirm site safety..."
              className="mt-1.5 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#172033] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <span className="block text-xs font-medium text-[#475569] dark:text-slate-300">
              Completion Photograph
            </span>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              onChange={handlePhotoUpload}
              className="hidden"
              aria-label="Upload completion photograph"
            />
            {completionPhotoUrl ? (
              <div className="mt-2 space-y-2">
                <CivicImage
                  src={completionPhotoUrl}
                  alt="Completion evidence preview"
                  className="h-36 w-full"
                />
                <button
                  type="button"
                  onClick={() => setCompletionPhotoUrl('')}
                  className="text-xs font-medium text-[#DC2626] hover:underline"
                >
                  Remove photo
                </button>
              </div>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-medium text-[#172033] hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{uploading ? 'Uploading...' : 'Upload Completion Photo'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCompletionPhotoUrl('/demo-photos/resolved-road.svg')}
                  className="rounded-lg border border-[#E5E7EB] bg-[#F7F8FA] px-3 py-2 text-xs font-medium text-[#475569] hover:text-[#172033] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  Attach Sample Proof
                </button>
              </div>
            )}
          </div>
        </div>
      </ConfirmDialog>
    </AppShell>
  );
};
