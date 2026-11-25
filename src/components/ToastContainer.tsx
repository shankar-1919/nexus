import React from 'react';
import { CheckCircle2, Info, AlertCircle, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-full max-w-sm flex-col gap-2"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const icon =
          toast.tone === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#16A34A]" aria-hidden="true" />
          ) : toast.tone === 'error' ? (
            <AlertCircle className="h-4 w-4 shrink-0 text-[#DC2626]" aria-hidden="true" />
          ) : (
            <Info className="h-4 w-4 shrink-0 text-[#4F46E5]" aria-hidden="true" />
          );

        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 rounded-lg border border-[#E5E7EB] bg-white p-3.5 shadow-lg transition-all dark:border-slate-700 dark:bg-slate-900"
            role="status"
          >
            <div className="mt-0.5">{icon}</div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#172033] dark:text-slate-100">{toast.title}</p>
              {toast.description && (
                <p className="mt-0.5 text-xs text-[#64748B] dark:text-slate-400">
                  {toast.description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
              className="rounded p-1 text-[#64748B] hover:bg-slate-100 hover:text-[#172033] dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
