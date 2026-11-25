import React from 'react';
import { MapPin, CheckCircle2, Clock } from 'lucide-react';
import type { Complaint } from '../types/complaint';
import { getSeverityHex } from './StatusIndicators';

interface HeroCityVisualProps {
  complaints: Complaint[];
  onInspectComplaint: (id: string) => void;
}

export const HeroCityVisual: React.FC<HeroCityVisualProps> = ({
  complaints,
  onInspectComplaint,
}) => {
  const featured = complaints.slice(0, 4);
  const pinPositions = [
    { x: 24, y: 34 },
    { x: 58, y: 28 },
    { x: 74, y: 58 },
    { x: 38, y: 66 },
  ];

  const resolvedCount = complaints.filter((c) => c.status === 'Resolved').length;
  const activeCount = complaints.filter((c) => c.status !== 'Resolved' && c.status !== 'Rejected').length;

  return (
    <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-xl border border-[#E5E7EB] bg-white dark:border-slate-800 dark:bg-slate-900">
      {/* Clean Cartographic City Map Canvas */}
      <div className="relative h-72 w-full bg-[#F1F5F9] sm:h-80 lg:h-full lg:min-h-[380px] dark:bg-[#131C2E]">
        <svg
          viewBox="0 0 640 420"
          className="h-full w-full object-cover"
          role="img"
          aria-label="Civic infrastructure coverage map showing reported community issues"
        >
          {/* Subtle city blocks */}
          <rect width="640" height="420" fill="currentColor" className="text-[#EFF3F8] dark:text-[#111827]" />
          <g className="text-[#E2E8F0] dark:text-slate-800/80" fill="currentColor">
            <rect x="24" y="24" width="120" height="78" rx="6" />
            <rect x="170" y="24" width="150" height="78" rx="6" />
            <rect x="348" y="24" width="130" height="78" rx="6" />
            <rect x="504" y="24" width="112" height="78" rx="6" />
            <rect x="24" y="130" width="120" height="110" rx="6" />
            <rect x="170" y="130" width="150" height="110" rx="6" />
            <rect x="348" y="130" width="130" height="110" rx="6" />
            <rect x="504" y="130" width="112" height="110" rx="6" />
            <rect x="24" y="268" width="120" height="120" rx="6" />
            <rect x="170" y="268" width="150" height="120" rx="6" />
            <rect x="348" y="268" width="130" height="120" rx="6" />
            <rect x="504" y="268" width="112" height="120" rx="6" />
          </g>

          {/* Green Civic Park & Water Canal */}
          <rect x="356" y="138" width="114" height="94" rx="6" fill="#DCFCE7" className="dark:opacity-25" />
          <path
            d="M0 324 C140 318 240 280 370 286 C485 292 560 320 640 302"
            fill="none"
            stroke="#BAE6FD"
            strokeWidth="14"
            className="dark:opacity-30"
          />

          {/* Major Arterial Roads */}
          <g stroke="#FFFFFF" strokeWidth="10" className="dark:stroke-slate-700">
            <line x1="157" y1="0" x2="157" y2="420" />
            <line x1="334" y1="0" x2="334" y2="420" />
            <line x1="491" y1="0" x2="491" y2="420" />
            <line x1="0" y1="116" x2="640" y2="116" />
            <line x1="0" y1="254" x2="640" y2="254" />
          </g>
          <path
            d="M0 198 L157 198 L334 116 L640 116"
            fill="none"
            stroke="#4F46E5"
            strokeWidth="2.5"
            strokeDasharray="6 6"
            opacity="0.55"
          />
        </svg>

        {/* Interactive Incident Markers */}
        {featured.map((item, idx) => {
          const pos = pinPositions[idx];
          const color = getSeverityHex(item.severity);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onInspectComplaint(item.id)}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              className="group absolute -translate-x-1/2 -translate-y-1/2 rounded-lg border border-[#E5E7EB] bg-white px-2.5 py-1.5 text-left shadow-sm transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-[#4F46E5] dark:border-slate-700 dark:bg-slate-900"
              aria-label={`Inspect ${item.category} in ${item.location.area}`}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: color }}
                >
                  <MapPin className="h-3 w-3" aria-hidden="true" />
                </span>
                <div>
                  <div className="text-[11px] font-semibold leading-tight text-[#172033] dark:text-slate-100 whitespace-nowrap">
                    {item.category}
                  </div>
                  <div className="text-[10px] text-[#64748B] dark:text-slate-400 whitespace-nowrap">
                    {item.location.area} · {item.severity}
                  </div>
                </div>
              </div>
            </button>
          );
        })}

        {/* Quiet Bottom Summary Strip Inside Map */}
        <div className="absolute right-4 bottom-4 left-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#E5E7EB] bg-white/95 px-4 py-3 backdrop-blur-xs dark:border-slate-700 dark:bg-slate-900/95">
          <div>
            <p className="text-xs font-semibold text-[#172033] dark:text-slate-100">
              Hyderabad Demo Service Area
            </p>
            <p className="text-xs text-[#64748B] dark:text-slate-400">
              Click any map issue to view its tracking timeline
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium tabular-nums">
            <span className="inline-flex items-center gap-1.5 text-[#172033] dark:text-slate-200">
              <Clock className="h-3.5 w-3.5 text-[#4F46E5]" aria-hidden="true" />
              {activeCount} Active
            </span>
            <span className="inline-flex items-center gap-1.5 text-[#16A34A] dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              {resolvedCount} Resolved
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
