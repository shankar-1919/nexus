import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Compass, Shield, User, Wrench } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { UserRole } from '../types/complaint';

export const DemoLoginPage: React.FC = () => {
  const { loginAsRole } = useApp();
  const navigate = useNavigate();

  const handleSelectRole = (selected: UserRole) => {
    loginAsRole(selected);
    if (selected === 'admin') navigate('/admin');
    else if (selected === 'officer') navigate('/field-tasks');
    else navigate('/dashboard');
  };

  const roles: {
    id: UserRole;
    title: string;
    subtitle: string;
    cta: string;
    icon: React.FC<{ className?: string }>;
    capabilities: string[];
  }[] = [
    {
      id: 'citizen',
      title: 'Citizen',
      subtitle: 'Report public infrastructure issues and track progress',
      cta: 'Continue as Citizen',
      icon: User,
      capabilities: [
        'Submit reports with photographs and map pin',
        'View AI assessment and transparent tracking timeline',
        'Browse community issues across the map',
        'Submit feedback after verified resolution',
      ],
    },
    {
      id: 'admin',
      title: 'Administrator',
      subtitle: 'Review AI triage, approve reports, and coordinate teams',
      cta: 'Continue as Administrator',
      icon: Shield,
      capabilities: [
        'Monitor live operations KPIs and analytics charts',
        'Review AI assessments with human approval controls',
        'Adjust severity, department, and assign field officers',
        'Audit complete complaint timelines and notes',
      ],
    },
    {
      id: 'officer',
      title: 'Field Officer',
      subtitle: 'Execute assigned field repairs and upload proof',
      cta: 'Continue as Field Officer',
      icon: Wrench,
      capabilities: [
        'View assigned tasks grouped by status',
        'Accept assignments and start on-site work',
        'Inspect exact coordinates on the community map',
        'Upload completion photographs and mark resolved',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FA] px-4 py-10 sm:px-6 lg:px-8 dark:bg-[#0B1120]">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#64748B] transition-colors hover:text-[#172033] dark:text-slate-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Back to Home</span>
          </Link>

          <Link
            to="/"
            className="flex items-center gap-2 font-display text-base font-bold text-[#172033] dark:text-white"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#4F46E5] text-white">
              <Compass className="h-4 w-4" aria-hidden="true" />
            </span>
            <span>NEXUS AI</span>
          </Link>
        </div>

        <div className="mt-10 max-w-2xl">
          <p className="text-xs font-semibold text-[#4F46E5] dark:text-indigo-400">
            Demo Mode · No Account Required
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#172033] dark:text-white">
            Choose a role to explore NEXUS AI
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#64748B] dark:text-slate-400">
            All three roles share the same persistent complaint dataset. You can switch roles at any time from the top navigation bar to demonstrate the complete end-to-end workflow.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {roles.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                className="flex flex-col justify-between rounded-xl border border-[#E5E7EB] bg-white p-6 transition-colors hover:border-[#CBD5E1] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
              >
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#4F46E5] dark:bg-indigo-950/70 dark:text-indigo-400">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h2 className="mt-4 font-display text-lg font-semibold text-[#172033] dark:text-white">
                    {card.title}
                  </h2>
                  <p className="mt-1 text-sm text-[#64748B] dark:text-slate-400">{card.subtitle}</p>

                  <ul className="mt-5 space-y-2.5 border-t border-[#E5E7EB] pt-5 text-xs leading-relaxed text-[#475569] dark:border-slate-800 dark:text-slate-300">
                    {card.capabilities.map((cap) => (
                      <li key={cap} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#4F46E5]" />
                        <span>{cap}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectRole(card.id)}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#4F46E5] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#4338CA] whitespace-nowrap"
                >
                  <span>{card.cta}</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-xs text-[#64748B] dark:text-slate-400">
          Demo Mode notice: Authentication is simplified for hackathon demonstration. Seeded complaints represent sample data in Hyderabad.
        </p>
      </div>
    </div>
  );
};
