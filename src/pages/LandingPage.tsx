import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  FileSearch,
  MapPin,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { HeroCityVisual } from '../components/HeroCityVisual';
import { computeDashboardKPIs } from '../lib/workflow';

export const LandingPage: React.FC = () => {
  const { complaints, role, loginAsRole, t } = useApp();
  const navigate = useNavigate();
  const kpis = computeDashboardKPIs(complaints);

  const handleReportClick = () => {
    if (!role) {
      loginAsRole('citizen');
    }
    navigate('/report');
  };

  const handleExploreClick = () => {
    if (role === 'admin') navigate('/admin');
    else if (role === 'officer') navigate('/field-tasks');
    else if (role === 'citizen') navigate('/dashboard');
    else navigate('/login');
  };

  const handleInspectFromMap = (id: string) => {
    if (!role) {
      loginAsRole('citizen');
    }
    navigate(`/complaints/${id}`);
  };

  return (
    <div id="home" className="min-h-screen bg-[#F7F8FA] text-[#172033] dark:bg-[#0B1120] dark:text-slate-100">
      {/* Top Bar — Clean 3-zone contract */}
      <header className="sticky top-0 z-30 border-b border-[#E5E7EB] bg-white/95 backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
          <a
            href="#home"
            className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-[#172033] whitespace-nowrap shrink-0 dark:text-white"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#4F46E5] text-white">
              <Compass className="h-4 w-4" aria-hidden="true" />
            </span>
            <span>NEXUS AI</span>
          </a>

          <nav
            aria-label="Primary navigation"
            className="hidden items-center gap-7 text-sm font-medium text-[#64748B] md:flex dark:text-slate-300"
          >
            <a
              href="#home"
              className="transition-colors hover:text-[#172033] dark:hover:text-white whitespace-nowrap shrink-0"
            >
              {t.landing.navHome}
            </a>
            <a
              href="#how-it-works"
              className="transition-colors hover:text-[#172033] dark:hover:text-white whitespace-nowrap shrink-0"
            >
              {t.landing.navHowItWorks}
            </a>
            <a
              href="#features"
              className="transition-colors hover:text-[#172033] dark:hover:text-white whitespace-nowrap shrink-0"
            >
              {t.landing.navFeatures}
            </a>
            <a
              href="#about"
              className="transition-colors hover:text-[#172033] dark:hover:text-white whitespace-nowrap shrink-0"
            >
              {t.landing.navAbout}
            </a>
          </nav>

          <div className="flex items-center gap-4 shrink-0">
            <Link
              to="/login"
              className="text-sm font-medium text-[#475569] transition-colors hover:text-[#172033] dark:text-slate-300 dark:hover:text-white whitespace-nowrap shrink-0"
            >
              {t.landing.signIn}
            </Link>
            <Link
              to="/login"
              className="rounded-lg bg-[#4F46E5] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4338CA] whitespace-nowrap shrink-0"
            >
              {t.landing.getStarted}
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="mx-auto max-w-[1200px] px-4 pt-12 pb-16 sm:px-6 lg:px-8 lg:pt-16 lg:pb-20">
          <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="flex flex-col justify-center lg:col-span-6">
              <p className="text-xs font-semibold tracking-wide text-[#4F46E5] dark:text-indigo-400">
                Civic Infrastructure Management · Demo Platform
              </p>
              <h1 className="mt-3 font-display text-4xl font-bold leading-[1.12] tracking-tight text-[#172033] sm:text-5xl dark:text-white">
                {t.landing.heroTitle}
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-[#64748B] dark:text-slate-300">
                {t.landing.heroSubtitle}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3.5">
                <button
                  type="button"
                  onClick={handleReportClick}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#4F46E5] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#4338CA] whitespace-nowrap"
                >
                  <span>{t.landing.reportCta}</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={handleExploreClick}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-5 py-3 text-sm font-medium text-[#172033] transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
                >
                  <span>{t.landing.exploreCta}</span>
                </button>
              </div>

              <div className="mt-10 grid grid-cols-3 gap-6 border-t border-[#E5E7EB] pt-6 dark:border-slate-800">
                <div>
                  <div className="font-mono text-2xl font-semibold text-[#172033] tabular-nums dark:text-white">
                    {kpis.total}
                  </div>
                  <div className="mt-1 text-xs text-[#64748B] dark:text-slate-400">
                    Tracked Demo Reports
                  </div>
                </div>
                <div>
                  <div className="font-mono text-2xl font-semibold text-[#172033] tabular-nums dark:text-white">
                    6
                  </div>
                  <div className="mt-1 text-xs text-[#64748B] dark:text-slate-400">
                    Municipal Departments
                  </div>
                </div>
                <div>
                  <div className="font-mono text-2xl font-semibold text-[#16A34A] tabular-nums dark:text-emerald-400">
                    {kpis.resolved}
                  </div>
                  <div className="mt-1 text-xs text-[#64748B] dark:text-slate-400">
                    Verified Resolutions
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <HeroCityVisual
                complaints={complaints}
                onInspectComplaint={handleInspectFromMap}
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section
          id="features"
          className="border-t border-[#E5E7EB] bg-white py-16 lg:py-20 dark:border-slate-800 dark:bg-slate-900/60"
        >
          <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <h2 className="font-display text-2xl font-bold tracking-tight text-[#172033] sm:text-3xl dark:text-white">
                Built for citizens, coordinators, and field crews
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#64748B] sm:text-base dark:text-slate-400">
                One shared workflow connects neighborhood reports to human-reviewed dispatch and verified on-site repair.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-12">
              <article className="rounded-xl border border-[#E5E7EB] bg-[#F7F8FA]/60 p-6 lg:col-span-7 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#4F46E5] dark:bg-indigo-950/70 dark:text-indigo-400">
                  <Camera className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[#172033] dark:text-white">
                  Smart Reporting
                </h3>
                <p className="mt-2 max-w-lg text-sm leading-relaxed text-[#64748B] dark:text-slate-400">
                  Report public infrastructure issues with photographs and location information using a simple guided form that works on desktop and mobile.
                </p>
              </article>

              <article className="rounded-xl border border-[#E5E7EB] bg-[#F7F8FA]/60 p-6 lg:col-span-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#4F46E5] dark:bg-indigo-950/70 dark:text-indigo-400">
                  <FileSearch className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[#172033] dark:text-white">
                  AI-Powered Analysis
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#64748B] dark:text-slate-400">
                  Identify the issue, estimate severity, and recommend the next action and department while keeping final decisions with human administrators.
                </p>
              </article>

              <article className="rounded-xl border border-[#E5E7EB] bg-[#F7F8FA]/60 p-6 lg:col-span-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#4F46E5] dark:bg-indigo-950/70 dark:text-indigo-400">
                  <MapPin className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[#172033] dark:text-white">
                  Transparent Tracking
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#64748B] dark:text-slate-400">
                  Follow every complaint from submission to resolution with timestamped updates, department ownership, and completion photos.
                </p>
              </article>

              <article className="rounded-xl border border-[#E5E7EB] bg-[#F7F8FA]/60 p-6 lg:col-span-7 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#4F46E5] dark:bg-indigo-950/70 dark:text-indigo-400">
                  <Users className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[#172033] dark:text-white">
                  Coordinated Response
                </h3>
                <p className="mt-2 max-w-lg text-sm leading-relaxed text-[#64748B] dark:text-slate-400">
                  Connect administrators and field officers through a shared workflow so urgent hazards are reviewed, assigned, and closed efficiently.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* How It Works — 4-Step Workflow */}
        <section id="how-it-works" className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl font-bold tracking-tight text-[#172033] sm:text-3xl dark:text-white">
              How NEXUS AI works
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#64748B] sm:text-base dark:text-slate-400">
              Four clear stages turn a neighborhood observation into a documented resolution.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                num: '01',
                title: 'Report an Issue',
                desc: 'Select the category, attach a photo if available, add a note, and mark the street location.',
                icon: Camera,
              },
              {
                num: '02',
                title: 'AI Analyzes the Report',
                desc: 'Structured triage assesses issue severity, area context, and recommends the responsible department.',
                icon: ClipboardCheck,
              },
              {
                num: '03',
                title: 'Team Reviews and Responds',
                desc: 'An administrator verifies the assessment, approves priority, and assigns a field officer.',
                icon: ShieldCheck,
              },
              {
                num: '04',
                title: 'Problem Gets Resolved',
                desc: 'Field crews complete repairs, upload completion evidence, and citizens share feedback.',
                icon: CheckCircle2,
              },
            ].map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className="rounded-xl border border-[#E5E7EB] bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-[#4F46E5] tabular-nums dark:text-indigo-400">
                      {step.num}
                    </span>
                    <Icon className="h-4.5 w-4.5 text-[#64748B] dark:text-slate-400" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-[#172033] dark:text-white">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#64748B] dark:text-slate-400">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* About & Demo Callout */}
        <section
          id="about"
          className="border-t border-[#E5E7EB] bg-white py-16 dark:border-slate-800 dark:bg-slate-900/60"
        >
          <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-8 px-4 sm:px-6 lg:flex-row lg:items-center lg:px-8">
            <div className="max-w-2xl">
              <h2 className="font-display text-2xl font-bold tracking-tight text-[#172033] dark:text-white">
                Try the complete citizen-to-field workflow in Demo Mode
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#64748B] dark:text-slate-400">
                Switch seamlessly between Citizen, Administrator, and Field Officer roles to test reporting, AI triage, human approval, task assignment, completion evidence, and live analytics without external accounts.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-[#4F46E5] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#4338CA] whitespace-nowrap"
              >
                <span>Open Demo Login</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                to="/map"
                className="rounded-lg border border-[#E5E7EB] bg-white px-5 py-2.5 text-sm font-medium text-[#172033] transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 whitespace-nowrap"
              >
                View Community Map
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E5E7EB] bg-[#F7F8FA] py-10 dark:border-slate-800 dark:bg-[#0B1120]">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 font-display text-base font-bold text-[#172033] dark:text-white">
              <Compass className="h-4 w-4 text-[#4F46E5]" aria-hidden="true" />
              <span>NEXUS AI</span>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-xs font-medium text-[#64748B] dark:text-slate-400">
              <a href="#about" className="hover:text-[#172033] dark:hover:text-white">
                About
              </a>
              <a href="#features" className="hover:text-[#172033] dark:hover:text-white">
                Features
              </a>
              <Link to="/help" className="hover:text-[#172033] dark:hover:text-white">
                Contact
              </Link>
              <Link to="/help#privacy" className="hover:text-[#172033] dark:hover:text-white">
                Privacy
              </Link>
            </div>
          </div>
          <p className="mt-6 border-t border-[#E5E7EB] pt-6 text-xs leading-relaxed text-[#64748B] dark:border-slate-800 dark:text-slate-400">
            Hackathon Demonstration Prototype — NEXUS AI is a demonstration platform using seeded civic sample data and is not an officially deployed government reporting portal.
          </p>
        </div>
      </footer>
    </div>
  );
};
