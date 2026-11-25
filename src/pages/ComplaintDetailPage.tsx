import React, { useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  MapPin,
  MessageSquarePlus,
  ShieldCheck,
  Star,
  Upload,
  UserCheck,
  Wrench,
  XCircle,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { useApp } from '../context/AppContext';
import { SeverityLabel, StatusLabel } from '../components/StatusIndicators';
import { CivicImage } from '../components/CivicImage';
import { AIAnalysisCard } from '../components/AIAnalysisCard';
import { ComplaintTimeline } from '../components/ComplaintTimeline';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { DEPARTMENTS, FIELD_OFFICERS, formatDateTime } from '../lib/workflow';
import type { Department, Severity } from '../types/complaint';

export const ComplaintDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    complaints,
    loading,
    role,
    approveComplaint,
    rejectComplaint,
    assignComplaint,
    updateComplaintFields,
    updateTaskStatus,
    resolveComplaint,
    submitFeedback,
    reanalyzeComplaint,
    uploadImage,
    pushToast,
  } = useApp();

  const complaint = useMemo(() => complaints.find((c) => c.id === id), [complaints, id]);
  const activeRole = role ?? 'citizen';

  // Admin state
  const [editSeverity, setEditSeverity] = useState<Severity | ''>('');
  const [editDepartment, setEditDepartment] = useState<Department | ''>('');
  const [adminNote, setAdminNote] = useState('');
  const [assignOfficer, setAssignOfficer] = useState(FIELD_OFFICERS[0].name);
  const [assignDueDate, setAssignDueDate] = useState(
    new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10)
  );
  const [assignInstructions, setAssignInstructions] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  // Confirm dialogs
  const [confirmApproveOpen, setConfirmApproveOpen] = useState(false);
  const [confirmRejectOpen, setConfirmRejectOpen] = useState(false);
  const [confirmResolveOpen, setConfirmResolveOpen] = useState(false);

  // Citizen state
  const [citizenInfo, setCitizenInfo] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');

  // Officer resolution state
  const [resolutionNote, setResolutionNote] = useState('');
  const [completionPhotoUrl, setCompletionPhotoUrl] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const completionFileRef = useRef<HTMLInputElement | null>(null);

  const [busy, setBusy] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);

  if (!complaint && loading) {
    return (
      <AppShell breadcrumbs={[{ label: 'Complaints', to: '/my-reports' }, { label: id || 'Loading' }]}>
        <div className="space-y-6" aria-busy="true" aria-label="Loading complaint details">
          <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="h-72 animate-pulse rounded-xl bg-slate-200 lg:col-span-8 dark:bg-slate-800" />
            <div className="h-72 animate-pulse rounded-xl bg-slate-200 lg:col-span-4 dark:bg-slate-800" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (!complaint) {
    return (
      <AppShell breadcrumbs={[{ label: 'Complaints', to: '/my-reports' }, { label: 'Not Found' }]}>
        <div className="mx-auto max-w-lg rounded-xl border border-[#E5E7EB] bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
          <h1 className="font-display text-xl font-bold text-[#172033] dark:text-white">
            Complaint not found
          </h1>
          <p className="mt-2 text-sm text-[#64748B] dark:text-slate-400">
            The report ID <span className="font-mono">{id}</span> does not exist in the current dataset.
          </p>
          <Link
            to="/my-reports"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#4F46E5] px-4 py-2 text-sm font-medium text-white hover:bg-[#4338CA]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Back to Reports</span>
          </Link>
        </div>
      </AppShell>
    );
  }

  const effectiveSeverity = (editSeverity || complaint.severity) as Severity;
  const effectiveDepartment = (editDepartment || complaint.department) as Department;

  const handleApprove = async () => {
    setBusy(true);
    try {
      await approveComplaint(complaint.id, {
        severity: effectiveSeverity,
        department: effectiveDepartment,
        note: adminNote.trim() || undefined,
      });
      setAdminNote('');
      setConfirmApproveOpen(false);
    } catch (err) {
      pushToast('Action failed', err instanceof Error ? err.message : 'Unable to approve', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    setBusy(true);
    try {
      await rejectComplaint(
        complaint.id,
        rejectReason.trim() || 'Report could not be verified for municipal dispatch.'
      );
      setRejectReason('');
      setConfirmRejectOpen(false);
    } catch (err) {
      pushToast('Action failed', err instanceof Error ? err.message : 'Unable to reject', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await assignComplaint(complaint.id, {
        officer: assignOfficer,
        department: effectiveDepartment,
        dueDate: assignDueDate,
        instructions: assignInstructions.trim() || complaint.aiAnalysis.recommendedAction,
      });
      setAssignInstructions('');
    } catch (err) {
      pushToast('Assignment failed', err instanceof Error ? err.message : 'Unable to assign', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleSaveAdminEdits = async () => {
    setBusy(true);
    try {
      await updateComplaintFields(complaint.id, {
        severity: effectiveSeverity,
        department: effectiveDepartment,
        note: adminNote.trim() || undefined,
      });
      setAdminNote('');
    } catch (err) {
      pushToast('Update failed', err instanceof Error ? err.message : 'Unable to save', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleAddCitizenInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citizenInfo.trim()) return;
    setBusy(true);
    try {
      await updateComplaintFields(complaint.id, { note: citizenInfo.trim() });
      setCitizenInfo('');
    } catch (err) {
      pushToast('Update failed', err instanceof Error ? err.message : 'Unable to add note', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleCompletionUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const url = await uploadImage(file);
      setCompletionPhotoUrl(url);
    } catch (err) {
      pushToast('Upload failed', err instanceof Error ? err.message : 'Could not upload photo', 'error');
    } finally {
      setUploadingPhoto(false);
      if (completionFileRef.current) completionFileRef.current.value = '';
    }
  };

  const handleResolve = async () => {
    if (!resolutionNote.trim()) {
      pushToast('Resolution note required', 'Please describe the repair completed on site.', 'error');
      return;
    }
    setBusy(true);
    try {
      await resolveComplaint(complaint.id, {
        note: resolutionNote.trim(),
        completionPhotoUrl: completionPhotoUrl || undefined,
      });
      setResolutionNote('');
      setCompletionPhotoUrl('');
      setConfirmResolveOpen(false);
    } catch (err) {
      pushToast('Action failed', err instanceof Error ? err.message : 'Unable to resolve', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await submitFeedback(complaint.id, {
        rating: feedbackRating,
        comment: feedbackComment.trim(),
      });
      setFeedbackComment('');
    } catch (err) {
      pushToast('Feedback failed', err instanceof Error ? err.message : 'Unable to submit', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleReanalyze = async () => {
    setReanalyzing(true);
    try {
      await reanalyzeComplaint(complaint.id);
    } finally {
      setReanalyzing(false);
    }
  };

  return (
    <AppShell
      breadcrumbs={[
        {
          label: activeRole === 'admin' ? 'Operations' : activeRole === 'officer' ? 'Field Tasks' : 'My Reports',
          to: activeRole === 'admin' ? '/admin' : activeRole === 'officer' ? '/field-tasks' : '/my-reports',
        },
        { label: complaint.id },
      ]}
    >
      <div className="space-y-6">
        {/* Top Back Link & Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#64748B] hover:text-[#172033] dark:text-slate-400 dark:hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Back</span>
            </button>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="font-display text-2xl font-bold tracking-tight text-[#172033] dark:text-white">
                {complaint.category}
              </h1>
              <span className="font-mono text-sm font-medium text-[#64748B] dark:text-slate-400">
                {complaint.id}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-[#64748B] dark:text-slate-400">
              <SeverityLabel severity={complaint.severity} />
              <span aria-hidden="true">·</span>
              <StatusLabel status={complaint.status} />
              <span aria-hidden="true">·</span>
              <span>Submitted {formatDateTime(complaint.submittedAt)}</span>
            </div>
          </div>

          <Link
            to={`/map?focus=${complaint.id}`}
            className="inline-flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3.5 py-2 text-xs font-medium text-[#172033] transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 whitespace-nowrap"
          >
            <MapPin className="h-3.5 w-3.5 text-[#4F46E5]" aria-hidden="true" />
            <span>View on Map</span>
          </Link>
        </div>

        {/* Main 2-Column Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Report Details + AI Analysis + Timeline */}
          <div className="space-y-6 lg:col-span-8">
            {/* Core Report Summary */}
            <section className="rounded-xl border border-[#E5E7EB] bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
                <div className="md:col-span-5">
                  <CivicImage
                    src={complaint.photoUrl}
                    alt={`${complaint.category} reported photograph`}
                    className="h-56 w-full"
                  />
                </div>
                <div className="space-y-4 md:col-span-7">
                  <div>
                    <h2 className="text-xs font-medium text-[#64748B] dark:text-slate-400">
                      Description
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-[#172033] dark:text-slate-200">
                      {complaint.description}
                    </p>
                  </div>

                  <dl className="grid grid-cols-1 gap-3 border-t border-[#E5E7EB] pt-4 text-xs sm:grid-cols-2 dark:border-slate-800">
                    <div>
                      <dt className="text-[#64748B] dark:text-slate-400">Location</dt>
                      <dd className="mt-0.5 font-medium text-[#172033] dark:text-slate-100">
                        {complaint.location.address}
                      </dd>
                      <dd className="mt-0.5 font-mono text-[11px] text-[#64748B] tabular-nums dark:text-slate-400">
                        {complaint.location.lat.toFixed(4)}, {complaint.location.lng.toFixed(4)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[#64748B] dark:text-slate-400">Responsible Department</dt>
                      <dd className="mt-0.5 font-medium text-[#172033] dark:text-slate-100">
                        {complaint.department}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[#64748B] dark:text-slate-400">Assigned Field Officer</dt>
                      <dd className="mt-0.5 font-medium text-[#172033] dark:text-slate-100">
                        {complaint.assignedOfficer || 'Not assigned yet'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[#64748B] dark:text-slate-400">Reported By</dt>
                      <dd className="mt-0.5 font-medium text-[#172033] dark:text-slate-100">
                        {complaint.submittedBy}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Resolution Evidence if Resolved */}
              {complaint.resolution && (
                <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50/40 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#16A34A] dark:text-emerald-400">
                    <CheckCircle2 className="h-4.5 w-4.5" aria-hidden="true" />
                    <span>Resolution Summary</span>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-12">
                    <div className="sm:col-span-7">
                      <p className="text-sm leading-relaxed text-[#172033] dark:text-slate-200">
                        {complaint.resolution.note}
                      </p>
                      <p className="mt-2 text-xs text-[#64748B] dark:text-slate-400">
                        Resolved by {complaint.resolution.resolvedBy} on{' '}
                        {formatDateTime(complaint.resolution.resolvedAt)}
                      </p>
                    </div>
                    {complaint.resolution.completionPhotoUrl && (
                      <div className="sm:col-span-5">
                        <CivicImage
                          src={complaint.resolution.completionPhotoUrl}
                          alt="Field repair completion photograph"
                          className="h-36 w-full"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* AI Assessment & 5-Agent Workflow */}
            <AIAnalysisCard
              analysis={complaint.aiAnalysis}
              complaintStatus={complaint.status}
              onReanalyze={activeRole === 'admin' ? handleReanalyze : undefined}
              reanalyzing={reanalyzing}
            />

            {/* Complaint 7-Stage Timeline */}
            <section className="rounded-xl border border-[#E5E7EB] bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-base font-semibold text-[#172033] dark:text-white">
                Complaint Timeline
              </h2>
              <p className="mt-1 text-xs text-[#64748B] dark:text-slate-400">
                Live progress across all seven civic resolution stages.
              </p>
              <div className="mt-5">
                <ComplaintTimeline complaint={complaint} />
              </div>
            </section>
          </div>

          {/* Right Column: Role-Specific Actions + Notes */}
          <div className="space-y-6 lg:col-span-4">
            {/* ADMIN ACTIONS */}
            {activeRole === 'admin' && (
              <section className="rounded-xl border border-[#E5E7EB] bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4.5 w-4.5 text-[#4F46E5]" aria-hidden="true" />
                  <h2 className="text-base font-semibold text-[#172033] dark:text-white">
                    Human Review & Coordination
                  </h2>
                </div>
                <p className="mt-1 text-xs text-[#64748B] dark:text-slate-400">
                  Verify the AI recommendation before approving and assigning a field officer.
                </p>

                <div className="mt-4 space-y-3.5">
                  <div>
                    <label
                      htmlFor="admin-severity"
                      className="block text-xs font-medium text-[#475569] dark:text-slate-300"
                    >
                      Priority / Severity
                    </label>
                    <select
                      id="admin-severity"
                      value={effectiveSeverity}
                      onChange={(e) => setEditSeverity(e.target.value as Severity)}
                      className="mt-1 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#172033] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="admin-department"
                      className="block text-xs font-medium text-[#475569] dark:text-slate-300"
                    >
                      Responsible Department
                    </label>
                    <select
                      id="admin-department"
                      value={effectiveDepartment}
                      onChange={(e) => setEditDepartment(e.target.value as Department)}
                      className="mt-1 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#172033] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    >
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="admin-note"
                      className="block text-xs font-medium text-[#475569] dark:text-slate-300"
                    >
                      Administrative Note (optional)
                    </label>
                    <textarea
                      id="admin-note"
                      rows={2}
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Add verification or dispatch note..."
                      className="mt-1 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#172033] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {complaint.status === 'Awaiting Review' && (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setConfirmApproveOpen(true)}
                          className="flex-1 rounded-lg bg-[#4F46E5] px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-[#4338CA] disabled:opacity-50 whitespace-nowrap"
                        >
                          Approve Report
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setConfirmRejectOpen(true)}
                          className="rounded-lg border border-red-200 bg-white px-3.5 py-2 text-xs font-medium text-[#DC2626] transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-900/60 dark:bg-slate-900 dark:text-red-400 whitespace-nowrap"
                        >
                          Reject Report
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={handleSaveAdminEdits}
                      className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3.5 py-2 text-xs font-medium text-[#172033] transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    >
                      Save Priority, Department & Note
                    </button>
                  </div>
                </div>

                {/* Officer Assignment Form */}
                {complaint.status !== 'Rejected' && complaint.status !== 'Resolved' && (
                  <form
                    onSubmit={handleAssign}
                    className="mt-5 space-y-3 border-t border-[#E5E7EB] pt-5 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#172033] dark:text-white">
                      <UserCheck className="h-4 w-4 text-[#4F46E5]" aria-hidden="true" />
                      <span>Assign Field Officer</span>
                    </div>

                    <div>
                      <label
                        htmlFor="assign-officer-select"
                        className="block text-xs font-medium text-[#475569] dark:text-slate-300"
                      >
                        Field Officer
                      </label>
                      <select
                        id="assign-officer-select"
                        value={assignOfficer}
                        onChange={(e) => setAssignOfficer(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#172033] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      >
                        {FIELD_OFFICERS.map((off) => (
                          <option key={off.id} value={off.name}>
                            {off.name} — {off.department.split(' ')[0]}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="assign-due-date"
                        className="block text-xs font-medium text-[#475569] dark:text-slate-300"
                      >
                        Target Completion Date
                      </label>
                      <div className="relative mt-1">
                        <Calendar
                          className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-[#94A3B8]"
                          aria-hidden="true"
                        />
                        <input
                          id="assign-due-date"
                          type="date"
                          value={assignDueDate}
                          onChange={(e) => setAssignDueDate(e.target.value)}
                          className="w-full rounded-lg border border-[#E5E7EB] bg-white py-2 pr-3 pl-9 text-sm text-[#172033] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="assign-instructions"
                        className="block text-xs font-medium text-[#475569] dark:text-slate-300"
                      >
                        Field Instructions
                      </label>
                      <textarea
                        id="assign-instructions"
                        rows={2}
                        value={assignInstructions}
                        onChange={(e) => setAssignInstructions(e.target.value)}
                        placeholder={complaint.aiAnalysis.recommendedAction}
                        className="mt-1 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#172033] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={busy}
                      className="w-full rounded-lg bg-[#4F46E5] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[#4338CA] disabled:opacity-50"
                    >
                      {complaint.assignedOfficer ? 'Reassign Field Officer' : 'Assign Field Officer'}
                    </button>
                  </form>
                )}
              </section>
            )}

            {/* FIELD OFFICER ACTIONS */}
            {activeRole === 'officer' && complaint.status !== 'Rejected' && (
              <section className="rounded-xl border border-[#E5E7EB] bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-2">
                  <Wrench className="h-4.5 w-4.5 text-[#4F46E5]" aria-hidden="true" />
                  <h2 className="text-base font-semibold text-[#172033] dark:text-white">
                    Field Officer Actions
                  </h2>
                </div>
                {complaint.instructions && (
                  <p className="mt-2 rounded-lg bg-[#F7F8FA] p-3 text-xs leading-relaxed text-[#475569] dark:bg-slate-800/70 dark:text-slate-300">
                    <span className="font-semibold text-[#172033] dark:text-white">
                      Instructions:{' '}
                    </span>
                    {complaint.instructions}
                  </p>
                )}

                {complaint.status === 'Resolved' ? (
                  <p className="mt-4 text-xs text-[#16A34A] dark:text-emerald-400">
                    This field task has been completed and closed.
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {complaint.status === 'Assigned' && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void updateTaskStatus(complaint.id, 'Accepted')}
                        className="w-full rounded-lg border border-[#4F46E5] bg-[#EEF2FF] px-4 py-2.5 text-xs font-semibold text-[#4F46E5] transition-colors hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300"
                      >
                        Accept Task
                      </button>
                    )}

                    {(complaint.status === 'Assigned' || complaint.status === 'Accepted') && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void updateTaskStatus(complaint.id, 'In Progress')}
                        className="w-full rounded-lg bg-[#0891B2] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-cyan-700"
                      >
                        Start Work (Mark In Progress)
                      </button>
                    )}

                    {/* Completion Evidence + Resolve */}
                    <div className="space-y-3 border-t border-[#E5E7EB] pt-4 dark:border-slate-800">
                      <h3 className="text-xs font-semibold text-[#172033] dark:text-white">
                        Complete & Close Task
                      </h3>
                      <div>
                        <label
                          htmlFor="officer-resolution-note"
                          className="block text-xs font-medium text-[#475569] dark:text-slate-300"
                        >
                          Resolution Note (required)
                        </label>
                        <textarea
                          id="officer-resolution-note"
                          rows={3}
                          value={resolutionNote}
                          onChange={(e) => setResolutionNote(e.target.value)}
                          placeholder="Describe the repair completed and site verification..."
                          className="mt-1 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#172033] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        />
                      </div>

                      <div>
                        <input
                          ref={completionFileRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          capture="environment"
                          onChange={handleCompletionUpload}
                          className="hidden"
                          aria-label="Upload completion evidence photograph"
                        />
                        {completionPhotoUrl ? (
                          <div className="space-y-2">
                            <CivicImage
                              src={completionPhotoUrl}
                              alt="Completion evidence preview"
                              className="h-32 w-full"
                            />
                            <button
                              type="button"
                              onClick={() => setCompletionPhotoUrl('')}
                              className="text-xs font-medium text-[#DC2626] hover:underline"
                            >
                              Remove completion photo
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={uploadingPhoto}
                              onClick={() => completionFileRef.current?.click()}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-medium text-[#172033] hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                            >
                              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>{uploadingPhoto ? 'Uploading...' : 'Upload Completion Photo'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setCompletionPhotoUrl('/demo-photos/resolved-road.svg')}
                              className="rounded-lg border border-[#E5E7EB] bg-[#F7F8FA] px-3 py-1.5 text-xs font-medium text-[#475569] hover:text-[#172033] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            >
                              Use Sample Proof
                            </button>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={busy || !resolutionNote.trim()}
                        onClick={() => setConfirmResolveOpen(true)}
                        className="w-full rounded-lg bg-[#16A34A] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                      >
                        Mark Resolved
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* CITIZEN ACTIONS */}
            {activeRole === 'citizen' && (
              <section className="rounded-xl border border-[#E5E7EB] bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-2">
                  <MessageSquarePlus className="h-4.5 w-4.5 text-[#4F46E5]" aria-hidden="true" />
                  <h2 className="text-base font-semibold text-[#172033] dark:text-white">
                    Citizen Updates & Feedback
                  </h2>
                </div>

                {complaint.status !== 'Resolved' && complaint.status !== 'Rejected' && (
                  <form onSubmit={handleAddCitizenInfo} className="mt-4 space-y-3">
                    <label
                      htmlFor="citizen-extra-info"
                      className="block text-xs font-medium text-[#475569] dark:text-slate-300"
                    >
                      Add Additional Information
                    </label>
                    <textarea
                      id="citizen-extra-info"
                      rows={3}
                      value={citizenInfo}
                      onChange={(e) => setCitizenInfo(e.target.value)}
                      placeholder="Share an update about conditions at this location..."
                      className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#172033] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                    <button
                      type="submit"
                      disabled={busy || !citizenInfo.trim()}
                      className="w-full rounded-lg bg-[#4F46E5] px-4 py-2 text-xs font-medium text-white hover:bg-[#4338CA] disabled:opacity-50"
                    >
                      Post Additional Info
                    </button>
                  </form>
                )}

                {complaint.status === 'Resolved' && (
                  <div className="mt-4">
                    {complaint.feedback ? (
                      <div className="rounded-lg bg-[#F7F8FA] p-4 dark:bg-slate-800/70">
                        <div className="flex items-center gap-1 text-[#D97706]">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                              key={n}
                              className={`h-4 w-4 ${
                                n <= complaint.feedback!.rating ? 'fill-current' : 'opacity-30'
                              }`}
                              aria-hidden="true"
                            />
                          ))}
                          <span className="ml-1.5 font-mono text-xs font-semibold text-[#172033] dark:text-slate-100">
                            {complaint.feedback.rating}/5
                          </span>
                        </div>
                        {complaint.feedback.comment && (
                          <p className="mt-2 text-xs leading-relaxed text-[#475569] dark:text-slate-300">
                            “{complaint.feedback.comment}”
                          </p>
                        )}
                        <p className="mt-2 text-[11px] text-[#64748B] dark:text-slate-400">
                          Feedback submitted {formatDateTime(complaint.feedback.submittedAt)}
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={handleFeedbackSubmit} className="space-y-3">
                        <p className="text-xs text-[#64748B] dark:text-slate-400">
                          Was this issue resolved satisfactorily? Rate the municipal response below.
                        </p>
                        <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Resolution rating">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => setFeedbackRating(n)}
                              aria-label={`Rate ${n} out of 5`}
                              className={`rounded-md p-1.5 transition-colors ${
                                n <= feedbackRating
                                  ? 'text-[#D97706]'
                                  : 'text-slate-300 dark:text-slate-600'
                              }`}
                            >
                              <Star className="h-5 w-5 fill-current" />
                            </button>
                          ))}
                        </div>
                        <textarea
                          rows={3}
                          value={feedbackComment}
                          onChange={(e) => setFeedbackComment(e.target.value)}
                          placeholder="Share feedback on repair quality or turnaround time..."
                          aria-label="Feedback comment"
                          className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#172033] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        />
                        <button
                          type="submit"
                          disabled={busy}
                          className="w-full rounded-lg bg-[#4F46E5] px-4 py-2 text-xs font-medium text-white hover:bg-[#4338CA] disabled:opacity-50"
                        >
                          Submit Feedback
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {complaint.status === 'Rejected' && (
                  <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-xs text-[#DC2626] dark:bg-red-950/30 dark:text-red-400">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>This complaint was rejected during administrative verification. Check notes below for details.</span>
                  </div>
                )}
              </section>
            )}

            {/* Notes History */}
            <section className="rounded-xl border border-[#E5E7EB] bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-sm font-semibold text-[#172033] dark:text-white">
                Notes & Updates ({complaint.notes.length})
              </h2>
              {complaint.notes.length === 0 ? (
                <p className="mt-3 text-xs text-[#64748B] dark:text-slate-400">
                  No additional notes have been recorded yet.
                </p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {complaint.notes.map((n) => (
                    <li
                      key={n.id}
                      className="rounded-lg border border-[#E5E7EB] bg-[#F7F8FA] p-3 text-xs dark:border-slate-800 dark:bg-slate-800/50"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-[#172033] dark:text-slate-100">
                          {n.author}
                        </span>
                        <span className="font-mono text-[10px] text-[#64748B] dark:text-slate-400">
                          {formatDateTime(n.timestamp).split(',')[0]}
                        </span>
                      </div>
                      <p className="mt-1 leading-relaxed text-[#475569] dark:text-slate-300">
                        {n.text}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </div>

      {/* Confirm Approve Dialog */}
      <ConfirmDialog
        open={confirmApproveOpen}
        title="Approve complaint for dispatch?"
        description={`Confirm ${effectiveSeverity} severity and route ${complaint.id} to ${effectiveDepartment}.`}
        confirmLabel="Confirm Approval"
        loading={busy}
        onConfirm={handleApprove}
        onCancel={() => setConfirmApproveOpen(false)}
      />

      {/* Confirm Reject Dialog */}
      <ConfirmDialog
        open={confirmRejectOpen}
        title="Reject this complaint?"
        description={`Provide a short reason for rejecting ${complaint.id}. This will be recorded in the citizen timeline.`}
        confirmLabel="Reject Report"
        variant="danger"
        loading={busy}
        onConfirm={handleReject}
        onCancel={() => setConfirmRejectOpen(false)}
      >
        <label htmlFor="reject-reason-input" className="block text-xs font-medium text-[#475569] dark:text-slate-300">
          Rejection Reason
        </label>
        <textarea
          id="reject-reason-input"
          rows={3}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="e.g. Duplicate report or outside municipal jurisdiction..."
          className="mt-1.5 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#172033] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </ConfirmDialog>

      {/* Confirm Resolve Dialog */}
      <ConfirmDialog
        open={confirmResolveOpen}
        title="Mark issue as Resolved?"
        description={`Confirm field completion for ${complaint.id}. The citizen will see your resolution note and completion photo on the tracking timeline.`}
        confirmLabel="Confirm Resolution"
        loading={busy}
        onConfirm={handleResolve}
        onCancel={() => setConfirmResolveOpen(false)}
      />
    </AppShell>
  );
};
