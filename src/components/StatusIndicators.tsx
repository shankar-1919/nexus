import React from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Info,
  ShieldCheck,
  UserCheck,
  Wrench,
  XCircle,
} from 'lucide-react';
import type { ComplaintStatus, Severity } from '../types/complaint';

export const SeverityLabel: React.FC<{ severity: Severity; className?: string }> = ({
  severity,
  className = '',
}) => {
  const config: Record<Severity, { text: string; icon: React.ReactNode }> = {
    Critical: {
      text: 'text-[#DC2626] dark:text-red-400',
      icon: <AlertOctagon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />,
    },
    High: {
      text: 'text-[#C2410C] dark:text-orange-400',
      icon: <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />,
    },
    Medium: {
      text: 'text-[#B45309] dark:text-amber-400',
      icon: <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />,
    },
    Low: {
      text: 'text-[#15803D] dark:text-emerald-400',
      icon: <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />,
    },
  };

  const c = config[severity];
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap ${c.text} ${className}`}
    >
      {c.icon}
      <span>{severity}</span>
    </span>
  );
};

export const StatusLabel: React.FC<{ status: ComplaintStatus; className?: string }> = ({
  status,
  className = '',
}) => {
  const config: Record<ComplaintStatus, { text: string; icon: React.ReactNode }> = {
    Submitted: {
      text: 'text-slate-600 dark:text-slate-300',
      icon: <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />,
    },
    'AI Analysis Completed': {
      text: 'text-[#4F46E5] dark:text-indigo-400',
      icon: <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />,
    },
    'Awaiting Review': {
      text: 'text-[#B45309] dark:text-amber-400',
      icon: <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />,
    },
    Approved: {
      text: 'text-[#0891B2] dark:text-cyan-400',
      icon: <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />,
    },
    Assigned: {
      text: 'text-[#4F46E5] dark:text-indigo-400',
      icon: <UserCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />,
    },
    Accepted: {
      text: 'text-[#4F46E5] dark:text-indigo-400',
      icon: <UserCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />,
    },
    'In Progress': {
      text: 'text-[#0891B2] dark:text-cyan-400',
      icon: <Wrench className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />,
    },
    Resolved: {
      text: 'text-[#16A34A] dark:text-emerald-400',
      icon: <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />,
    },
    Rejected: {
      text: 'text-[#DC2626] dark:text-red-400',
      icon: <XCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />,
    },
  };

  const c = config[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap ${c.text} ${className}`}
    >
      {c.icon}
      <span>{status}</span>
    </span>
  );
};

export function getSeverityHex(severity: Severity): string {
  switch (severity) {
    case 'Low':
      return '#16A34A';
    case 'Medium':
      return '#D97706';
    case 'High':
      return '#EA580C';
    case 'Critical':
      return '#DC2626';
  }
}
