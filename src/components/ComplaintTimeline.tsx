import React from 'react';
import { Check, Clock, XCircle } from 'lucide-react';
import type { Complaint } from '../types/complaint';
import { TIMELINE_STAGES, formatDateTime, getStageProgressIndex } from '../lib/workflow';

export const ComplaintTimeline: React.FC<{ complaint: Complaint }> = ({ complaint }) => {
  const currentIdx = getStageProgressIndex(complaint.status);
  const isRejected = complaint.status === 'Rejected';

  return (
    <div className="space-y-6">
      {/* 7-Stage Visual Progress Track */}
      <div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {TIMELINE_STAGES.map((stage, idx) => {
            const completed = !isRejected && idx <= currentIdx;
            const isCurrent = !isRejected && idx === currentIdx;
            const isRejectedPoint = isRejected && idx === 3;

            return (
              <div
                key={stage.key}
                className={`rounded-lg border p-3 transition-colors ${
                  isRejectedPoint
                    ? 'border-red-200 bg-red-50/70 dark:border-red-900/60 dark:bg-red-950/30'
                    : isCurrent
                    ? 'border-[#4F46E5] bg-[#EEF2FF]/70 dark:border-indigo-500 dark:bg-indigo-950/40'
                    : completed
                    ? 'border-[#E5E7EB] bg-white dark:border-slate-800 dark:bg-slate-900'
                    : 'border-[#E5E7EB] bg-[#F7F8FA] opacity-65 dark:border-slate-800 dark:bg-slate-900/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-medium text-[#64748B] tabular-nums dark:text-slate-400">
                    0{idx + 1}
                  </span>
                  {isRejectedPoint ? (
                    <XCircle className="h-4 w-4 text-[#DC2626]" aria-hidden="true" />
                  ) : completed ? (
                    <Check className="h-4 w-4 text-[#16A34A]" aria-hidden="true" />
                  ) : (
                    <Clock className="h-3.5 w-3.5 text-[#94A3B8]" aria-hidden="true" />
                  )}
                </div>
                <p className="mt-2 text-xs font-semibold leading-snug text-[#172033] dark:text-slate-100">
                  {isRejectedPoint ? 'Rejected' : stage.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chronological Event History */}
      <div className="border-t border-[#E5E7EB] pt-5 dark:border-slate-800">
        <h4 className="text-sm font-semibold text-[#172033] dark:text-slate-100">Activity Log</h4>
        <ol className="mt-4 space-y-4">
          {[...complaint.timeline].reverse().map((entry, idx) => (
            <li key={entry.id} className="relative flex gap-3.5">
              <div className="flex flex-col items-center">
                <div
                  className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    idx === 0
                      ? 'border-[#4F46E5] bg-[#EEF2FF] text-[#4F46E5] dark:border-indigo-400 dark:bg-indigo-950 dark:text-indigo-300'
                      : 'border-[#E5E7EB] bg-white text-[#64748B] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'
                  }`}
                >
                  <Check className="h-3 w-3" aria-hidden="true" />
                </div>
                {idx < complaint.timeline.length - 1 && (
                  <div className="mt-1 w-px flex-1 bg-[#E5E7EB] dark:bg-slate-800" />
                )}
              </div>
              <div className="min-w-0 flex-1 pb-2">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <span className="text-sm font-semibold text-[#172033] dark:text-slate-100">
                    {entry.stage}
                  </span>
                  <time className="font-mono text-xs text-[#64748B] tabular-nums dark:text-slate-400">
                    {formatDateTime(entry.timestamp)}
                  </time>
                </div>
                <p className="mt-1 text-sm text-[#475569] dark:text-slate-300">
                  {entry.description}
                </p>
                <p className="mt-1 text-xs text-[#64748B] dark:text-slate-400">
                  Actor: {entry.actor}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};
