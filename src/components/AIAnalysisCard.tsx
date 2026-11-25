import React from 'react';
import { CheckCircle2, RefreshCw, ShieldAlert } from 'lucide-react';
import type { AIAnalysis, ComplaintStatus } from '../types/complaint';
import { SeverityLabel } from './StatusIndicators';

interface AIAnalysisCardProps {
  analysis: AIAnalysis;
  complaintStatus?: ComplaintStatus;
  onReanalyze?: () => void;
  reanalyzing?: boolean;
  showAgentWorkflow?: boolean;
}

export const AIAnalysisCard: React.FC<AIAnalysisCardProps> = ({
  analysis,
  complaintStatus,
  onReanalyze,
  reanalyzing = false,
  showAgentWorkflow = true,
}) => {
  const isDemo = analysis.mode === 'demo';
  const humanCompleted =
    complaintStatus !== undefined &&
    ['Approved', 'Assigned', 'Accepted', 'In Progress', 'Resolved', 'Rejected'].includes(
      complaintStatus
    );

  return (
    <section className="rounded-xl border border-[#E5E7EB] bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E5E7EB] pb-4 dark:border-slate-800">
        <div>
          <h3 className="text-base font-semibold text-[#172033] dark:text-slate-100">
            AI Assessment
          </h3>
          <p className="mt-1 text-xs text-[#64748B] dark:text-slate-400">
            {isDemo
              ? 'Demo AI Assessment · Generated using predefined demonstration rules.'
              : 'AI-Assisted Analysis · Powered by Gemini multimodal understanding.'}
          </p>
        </div>

        {onReanalyze && (
          <button
            type="button"
            onClick={onReanalyze}
            disabled={reanalyzing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-medium text-[#172033] transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 whitespace-nowrap"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${reanalyzing ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>{reanalyzing ? 'Analyzing...' : 'Refresh Analysis'}</span>
          </button>
        )}
      </div>

      <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium text-[#64748B] dark:text-slate-400">Identified Issue</dt>
          <dd className="mt-1 text-sm font-semibold text-[#172033] dark:text-slate-100">
            {analysis.identifiedIssue}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-medium text-[#64748B] dark:text-slate-400">
            Recommended Severity
          </dt>
          <dd className="mt-1">
            <SeverityLabel severity={analysis.severity} />
          </dd>
        </div>

        <div>
          <dt className="text-xs font-medium text-[#64748B] dark:text-slate-400">
            Responsible Department
          </dt>
          <dd className="mt-1 text-sm font-medium text-[#172033] dark:text-slate-100">
            {analysis.department}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-medium text-[#64748B] dark:text-slate-400">Assessment Source</dt>
          <dd className="mt-1 text-sm font-medium text-[#172033] dark:text-slate-100">
            {isDemo
              ? 'Simulated Demo Rules (no fabricated confidence)'
              : analysis.confidence !== null
              ? `Gemini Model (${Math.round(analysis.confidence * 100)}%)`
              : 'Gemini AI-Assisted Analysis'}
          </dd>
        </div>

        <div className="sm:col-span-2">
          <dt className="text-xs font-medium text-[#64748B] dark:text-slate-400">AI Summary</dt>
          <dd className="mt-1 text-sm leading-relaxed text-[#334155] dark:text-slate-300">
            {analysis.summary}
          </dd>
        </div>

        <div className="sm:col-span-2">
          <dt className="text-xs font-medium text-[#64748B] dark:text-slate-400">
            Recommended Next Action
          </dt>
          <dd className="mt-1 text-sm leading-relaxed text-[#334155] dark:text-slate-300">
            {analysis.recommendedAction}
          </dd>
        </div>
      </dl>

      <div className="mt-5 flex items-center gap-2 rounded-lg bg-[#F7F8FA] px-3.5 py-2.5 text-xs text-[#475569] dark:bg-slate-800/70 dark:text-slate-300">
        <ShieldAlert className="h-4 w-4 shrink-0 text-[#4F46E5] dark:text-indigo-400" aria-hidden="true" />
        <span>AI-assisted assessment — requires human review before final dispatch.</span>
      </div>

      {showAgentWorkflow && analysis.agents.length > 0 && (
        <div className="mt-6 border-t border-[#E5E7EB] pt-5 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-[#172033] dark:text-slate-100">
              {isDemo ? 'Simulated AI Workflow' : 'AI-Assisted Analysis Workflow'}
            </h4>
            <span className="text-xs text-[#64748B] dark:text-slate-400">
              Report Received → 5 Analysis Stages → Human Approval
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {analysis.agents.map((agent, index) => (
              <div
                key={agent.id}
                className="rounded-lg border border-[#E5E7EB] bg-[#F7F8FA]/70 p-3 dark:border-slate-800 dark:bg-slate-800/40"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-mono text-[11px] font-medium text-[#64748B] tabular-nums dark:text-slate-400">
                    0{index + 1}
                  </span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#16A34A]" aria-hidden="true" />
                </div>
                <p className="mt-1.5 text-xs font-semibold text-[#172033] dark:text-slate-100">
                  {agent.name}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[#64748B] dark:text-slate-400">
                  {agent.output}
                </p>
              </div>
            ))}

            <div
              className={`rounded-lg border p-3 ${
                humanCompleted
                  ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20'
                  : 'border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="font-mono text-[11px] font-medium text-[#64748B] tabular-nums dark:text-slate-400">
                  06
                </span>
                <span
                  className={`text-[11px] font-semibold ${
                    humanCompleted
                      ? 'text-[#16A34A] dark:text-emerald-400'
                      : 'text-[#B45309] dark:text-amber-400'
                  }`}
                >
                  {humanCompleted ? 'Done' : 'Pending'}
                </span>
              </div>
              <p className="mt-1.5 text-xs font-semibold text-[#172033] dark:text-slate-100">
                Human Approval
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[#64748B] dark:text-slate-400">
                {humanCompleted
                  ? `Reviewed by municipal administrator (${complaintStatus}).`
                  : 'Administrator verifies severity and approves dispatch.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
