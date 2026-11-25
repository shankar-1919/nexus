import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  ChevronDown,
  ClipboardList,
  Compass,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Map as MapIcon,
  Menu,
  PlusCircle,
  Settings,
  Shield,
  User,
  Wrench,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { UserRole } from '../types/complaint';
import { formatDateTime } from '../lib/workflow';

interface AppShellProps {
  title?: string;
  breadcrumbs?: { label: string; to?: string }[];
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  breadcrumbs = [],
  actions,
  children,
}) => {
  const {
    role,
    switchRole,
    logout,
    profile,
    activeOfficerName,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    t,
  } = useApp();

  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const roleMenuRef = useRef<HTMLDivElement | null>(null);
  const notifRef = useRef<HTMLDivElement | null>(null);

  const activeRole: UserRole = role ?? 'citizen';
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  useEffect(() => {
    setMobileMenuOpen(false);
    setRoleMenuOpen(false);
    setNotifOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target as Node)) {
        setRoleMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = useMemo(() => {
    const base = [
      {
        to: activeRole === 'admin' ? '/admin' : activeRole === 'officer' ? '/field-tasks' : '/dashboard',
        label: t.nav.overview,
        icon: LayoutDashboard,
      },
      { to: '/report', label: t.nav.reportProblem, icon: PlusCircle },
      { to: '/my-reports', label: t.nav.myReports, icon: FileText },
      { to: '/map', label: t.nav.communityMap, icon: MapIcon },
      { to: '/insights', label: t.nav.aiInsights, icon: Lightbulb },
    ];

    if (activeRole === 'admin') {
      base.push({ to: '/admin', label: t.nav.management, icon: Shield });
    }
    if (activeRole === 'officer') {
      base.push({ to: '/field-tasks', label: t.nav.fieldTasks, icon: Wrench });
    }

    // Deduplicate when Overview already points to /admin or /field-tasks
    const seen = new Set<string>();
    return base.filter((item) => {
      if (item.to === '/admin' && item.label === t.nav.overview && activeRole === 'admin') {
        return false;
      }
      if (item.to === '/field-tasks' && item.label === t.nav.overview && activeRole === 'officer') {
        return false;
      }
      if (seen.has(item.to)) return false;
      seen.add(item.to);
      return true;
    });
  }, [activeRole, t.nav]);

  const roleMeta: Record<UserRole, { label: string; user: string }> = {
    citizen: { label: t.roles.citizen, user: profile.name },
    admin: { label: t.roles.admin, user: 'Meera Iyer' },
    officer: { label: t.roles.officer, user: activeOfficerName },
  };

  const handleRoleChange = (next: UserRole) => {
    switchRole(next);
    setRoleMenuOpen(false);
    if (next === 'admin') navigate('/admin');
    else if (next === 'officer') navigate('/field-tasks');
    else navigate('/dashboard');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderSidebarContent = () => (
    <div className="flex h-full flex-col bg-[#111827] text-slate-200">
      {/* Brand */}
      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
        <Link to="/" className="flex items-center gap-2.5 focus-visible:outline-none">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4F46E5] text-white">
            <Compass className="h-4.5 w-4.5" aria-hidden="true" />
          </div>
          <div>
            <div className="font-display text-sm font-bold tracking-tight text-white">
              {t.brandName}
            </div>
            <div className="text-[11px] text-slate-400">{t.brandSubtitle}</div>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close navigation menu"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Main Nav */}
      <nav aria-label="Main navigation" className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {activeRole !== 'citizen' && (
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-[#4F46E5] text-white'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`
            }
          >
            <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{t.nav.overview}</span>
          </NavLink>
        )}
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-[#4F46E5] text-white'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Sidebar */}
      <div className="space-y-1 border-t border-slate-800 px-3 py-3">
        <NavLink
          to="/help"
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              isActive
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
            }`
          }
        >
          <HelpCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{t.nav.helpSupport}</span>
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              isActive
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
            }`
          }
        >
          <Settings className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{t.nav.settings}</span>
        </NavLink>

        <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-slate-800/60 px-3 py-2.5">
          <Link
            to="/settings"
            className="flex min-w-0 items-center gap-2.5 text-left hover:opacity-90"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-white">
              <User className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-xs font-semibold text-white">
                {roleMeta[activeRole].user}
              </div>
              <div className="truncate text-[11px] text-slate-400">
                {roleMeta[activeRole].label} · {t.roles.demoMode}
              </div>
            </div>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            aria-label={t.nav.logout}
            title={t.nav.logout}
            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F7F8FA] text-[#172033] dark:bg-[#0B1120] dark:text-slate-100">
      {/* Desktop Fixed Left Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[240px] lg:block">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Slide-Over Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-slate-950/60"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-[260px] max-w-[85vw]">{renderSidebarContent()}</div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-[240px]">
        {/* Compact Top Navigation Bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b border-[#E5E7EB] bg-white/95 px-4 backdrop-blur-xs sm:px-6 dark:border-slate-800 dark:bg-slate-900/95">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="rounded-lg p-2 text-[#64748B] hover:bg-slate-100 hover:text-[#172033] lg:hidden dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <Menu className="h-5 w-5" />
            </button>

            <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-sm">
              <Link
                to="/"
                className="hidden text-[#64748B] hover:text-[#172033] sm:inline dark:text-slate-400 dark:hover:text-slate-200 whitespace-nowrap"
              >
                NEXUS AI
              </Link>
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={`${crumb.label}-${idx}`}>
                  <span className="hidden text-slate-300 sm:inline dark:text-slate-700">/</span>
                  {crumb.to ? (
                    <Link
                      to={crumb.to}
                      className="truncate text-[#64748B] hover:text-[#172033] dark:text-slate-400 dark:hover:text-slate-200"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="truncate font-semibold text-[#172033] dark:text-slate-100">
                      {crumb.label}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {actions}

            {/* Demo Role Switcher */}
            <div className="relative" ref={roleMenuRef}>
              <button
                type="button"
                onClick={() => setRoleMenuOpen((prev) => !prev)}
                aria-expanded={roleMenuOpen}
                aria-haspopup="menu"
                className="inline-flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-medium text-[#172033] transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 whitespace-nowrap"
              >
                <ClipboardList className="h-3.5 w-3.5 text-[#4F46E5] dark:text-indigo-400" aria-hidden="true" />
                <span>{roleMeta[activeRole].label}</span>
                <ChevronDown className="h-3.5 w-3.5 text-[#64748B]" aria-hidden="true" />
              </button>

              {roleMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-60 rounded-xl border border-[#E5E7EB] bg-white p-1.5 shadow-lg dark:border-slate-700 dark:bg-slate-900"
                >
                  <div className="px-3 py-1.5 text-[11px] font-medium text-[#64748B] dark:text-slate-400">
                    {t.roles.switchRole} ({t.roles.demoMode})
                  </div>
                  {(
                    [
                      { id: 'citizen', title: t.roles.citizen, desc: 'Report & track community issues' },
                      { id: 'admin', title: t.roles.admin, desc: 'Review AI, approve & assign teams' },
                      { id: 'officer', title: t.roles.officer, desc: 'Update tasks & upload evidence' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      role="menuitem"
                      onClick={() => handleRoleChange(opt.id)}
                      className={`flex w-full flex-col rounded-lg px-3 py-2 text-left transition-colors ${
                        activeRole === opt.id
                          ? 'bg-[#EEF2FF] text-[#4F46E5] dark:bg-indigo-950/60 dark:text-indigo-300'
                          : 'text-[#172033] hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-xs font-semibold">{opt.title}</span>
                      <span className="text-[11px] text-[#64748B] dark:text-slate-400">
                        {opt.desc}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* In-App Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotifOpen((prev) => !prev)}
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
                aria-expanded={notifOpen}
                className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#475569] transition-colors hover:bg-slate-50 hover:text-[#172033] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#4F46E5] px-1 font-mono text-[10px] font-semibold text-white tabular-nums">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-xl border border-[#E5E7EB] bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-3 dark:border-slate-800">
                    <span className="text-xs font-semibold text-[#172033] dark:text-slate-100">
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllNotificationsRead}
                        className="text-xs font-medium text-[#4F46E5] hover:underline dark:text-indigo-400"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 divide-y divide-[#E5E7EB] overflow-y-auto dark:divide-slate-800">
                    {notifications.length === 0 ? (
                      <p className="px-4 py-6 text-center text-xs text-[#64748B] dark:text-slate-400">
                        No notifications yet.
                      </p>
                    ) : (
                      notifications.slice(0, 8).map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => {
                            markNotificationRead(n.id);
                            if (n.complaintId) {
                              navigate(`/complaints/${n.complaintId}`);
                              setNotifOpen(false);
                            }
                          }}
                          className={`block w-full px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/70 ${
                            !n.read ? 'bg-[#EEF2FF]/40 dark:bg-indigo-950/20' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-[#172033] dark:text-slate-100">
                              {n.title}
                            </span>
                            <span className="font-mono text-[10px] text-[#64748B] tabular-nums dark:text-slate-400">
                              {formatDateTime(n.timestamp).split(',')[0]}
                            </span>
                          </div>
                          <p className="mt-1 text-xs leading-relaxed text-[#64748B] dark:text-slate-400">
                            {n.message}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
};
