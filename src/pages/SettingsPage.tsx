import React, { useState } from 'react';
import { Globe, Moon, RotateCcw, Sun } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { useApp } from '../context/AppContext';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { Language, UserRole } from '../types/complaint';

export const SettingsPage: React.FC = () => {
  const {
    profile,
    updateProfile,
    role,
    switchRole,
    preferences,
    updatePreferences,
    resetDemoData,
    pushToast,
    t,
  } = useApp();

  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone);
  const [ward, setWard] = useState(profile.ward);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      pushToast('Name required', 'Please enter a display name.', 'error');
      return;
    }
    updateProfile({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      ward: ward.trim(),
    });
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      await resetDemoData();
      setConfirmResetOpen(false);
    } finally {
      setResetting(false);
    }
  };

  const handleLanguageChange = (lang: Language) => {
    updatePreferences({ language: lang });
    pushToast(
      lang === 'te' ? 'భాష తెలుగులోకి మార్చబడింది' : 'Language changed to English',
      lang === 'te'
        ? 'ఇంటర్‌ఫేస్ లేబుల్స్ తెలుగులో అప్‌డేట్ అయ్యాయి.'
        : 'Interface labels updated to English.',
      'info'
    );
  };

  return (
    <AppShell breadcrumbs={[{ label: t.settings.title }]}>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#172033] dark:text-white">
            {t.settings.title}
          </h1>
          <p className="mt-1 text-sm text-[#64748B] dark:text-slate-400">{t.settings.subtitle}</p>
        </div>

        {/* Profile Information */}
        <form
          onSubmit={handleSaveProfile}
          className="rounded-xl border border-[#E5E7EB] bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
        >
          <h2 className="text-base font-semibold text-[#172033] dark:text-white">
            {t.settings.profileSection}
          </h2>
          <p className="mt-1 text-xs text-[#64748B] dark:text-slate-400">
            Used when submitting citizen reports in Demo Mode.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="settings-name"
                className="block text-xs font-medium text-[#475569] dark:text-slate-300"
              >
                Full Name
              </label>
              <input
                id="settings-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-[#E5E7EB] bg-white px-3.5 py-2 text-sm text-[#172033] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label
                htmlFor="settings-email"
                className="block text-xs font-medium text-[#475569] dark:text-slate-300"
              >
                Email Address
              </label>
              <input
                id="settings-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-[#E5E7EB] bg-white px-3.5 py-2 text-sm text-[#172033] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label
                htmlFor="settings-phone"
                className="block text-xs font-medium text-[#475569] dark:text-slate-300"
              >
                Phone Number
              </label>
              <input
                id="settings-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-[#E5E7EB] bg-white px-3.5 py-2 text-sm text-[#172033] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label
                htmlFor="settings-ward"
                className="block text-xs font-medium text-[#475569] dark:text-slate-300"
              >
                Neighborhood / Ward
              </label>
              <input
                id="settings-ward"
                type="text"
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-[#E5E7EB] bg-white px-3.5 py-2 text-sm text-[#172033] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              className="rounded-lg bg-[#4F46E5] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4338CA]"
            >
              {t.settings.saveBtn}
            </button>
          </div>
        </form>

        {/* Demo Role Selection */}
        <section className="rounded-xl border border-[#E5E7EB] bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-[#172033] dark:text-white">
            {t.settings.roleSection}
          </h2>
          <p className="mt-1 text-xs text-[#64748B] dark:text-slate-400">
            Switch your active perspective immediately for live presentations.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {(
              [
                { id: 'citizen', label: t.roles.citizen, desc: 'Report & track issues' },
                { id: 'admin', label: t.roles.admin, desc: 'Approve & assign crews' },
                { id: 'officer', label: t.roles.officer, desc: 'Resolve assigned tasks' },
              ] as { id: UserRole; label: string; desc: string }[]
            ).map((opt) => {
              const active = (role ?? 'citizen') === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => switchRole(opt.id)}
                  aria-pressed={active}
                  className={`rounded-lg border p-3.5 text-left transition-colors ${
                    active
                      ? 'border-[#4F46E5] bg-[#EEF2FF]/60 dark:border-indigo-500 dark:bg-indigo-950/40'
                      : 'border-[#E5E7EB] bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900'
                  }`}
                >
                  <div className="text-sm font-semibold text-[#172033] dark:text-white">
                    {opt.label}
                  </div>
                  <div className="mt-0.5 text-xs text-[#64748B] dark:text-slate-400">{opt.desc}</div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Appearance & Language */}
        <section className="rounded-xl border border-[#E5E7EB] bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-[#172033] dark:text-white">
            {t.settings.appearanceSection}
          </h2>

          <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Theme Preference */}
            <div>
              <span className="block text-xs font-medium text-[#475569] dark:text-slate-300">
                {t.settings.themeLabel}
              </span>
              <div className="mt-2 grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => updatePreferences({ theme: 'light' })}
                  aria-pressed={preferences.theme === 'light'}
                  className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium transition-colors ${
                    preferences.theme === 'light'
                      ? 'border-[#4F46E5] bg-[#EEF2FF] text-[#4F46E5]'
                      : 'border-[#E5E7EB] bg-white text-[#475569] hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  <Sun className="h-4 w-4" aria-hidden="true" />
                  <span>Light</span>
                </button>
                <button
                  type="button"
                  onClick={() => updatePreferences({ theme: 'dark' })}
                  aria-pressed={preferences.theme === 'dark'}
                  className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium transition-colors ${
                    preferences.theme === 'dark'
                      ? 'border-[#4F46E5] bg-indigo-950/60 text-indigo-300'
                      : 'border-[#E5E7EB] bg-white text-[#475569] hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  <Moon className="h-4 w-4" aria-hidden="true" />
                  <span>Dark</span>
                </button>
              </div>
            </div>

            {/* Language Selector */}
            <div>
              <span className="block text-xs font-medium text-[#475569] dark:text-slate-300">
                {t.settings.languageLabel}
              </span>
              <div className="mt-2 grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleLanguageChange('en')}
                  aria-pressed={preferences.language === 'en'}
                  className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium transition-colors ${
                    preferences.language === 'en'
                      ? 'border-[#4F46E5] bg-[#EEF2FF] text-[#4F46E5] dark:bg-indigo-950/60 dark:text-indigo-300'
                      : 'border-[#E5E7EB] bg-white text-[#475569] hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  <Globe className="h-4 w-4" aria-hidden="true" />
                  <span>English</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageChange('te')}
                  aria-pressed={preferences.language === 'te'}
                  className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium transition-colors ${
                    preferences.language === 'te'
                      ? 'border-[#4F46E5] bg-[#EEF2FF] text-[#4F46E5] dark:bg-indigo-950/60 dark:text-indigo-300'
                      : 'border-[#E5E7EB] bg-white text-[#475569] hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  <Globe className="h-4 w-4" aria-hidden="true" />
                  <span>తెలుగు (Telugu)</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Notification Preferences */}
        <section className="rounded-xl border border-[#E5E7EB] bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-[#172033] dark:text-white">
            {t.settings.notificationsSection}
          </h2>
          <p className="mt-1 text-xs text-[#64748B] dark:text-slate-400">
            Controls in-app toast alerts and the notification center. External SMS/email delivery is not connected in Demo Mode.
          </p>

          <div className="mt-4 space-y-3 text-sm">
            <label className="flex cursor-pointer items-center justify-between gap-4 py-1">
              <span className="text-[#172033] dark:text-slate-200">Report approval & status updates</span>
              <input
                type="checkbox"
                checked={preferences.notifyStatusChanges}
                onChange={(e) => updatePreferences({ notifyStatusChanges: e.target.checked })}
                className="h-4 w-4 rounded border-[#CBD5E1] text-[#4F46E5]"
              />
            </label>
            <label className="flex cursor-pointer items-center justify-between gap-4 py-1">
              <span className="text-[#172033] dark:text-slate-200">Field officer assignment alerts</span>
              <input
                type="checkbox"
                checked={preferences.notifyAssignments}
                onChange={(e) => updatePreferences({ notifyAssignments: e.target.checked })}
                className="h-4 w-4 rounded border-[#CBD5E1] text-[#4F46E5]"
              />
            </label>
            <label className="flex cursor-pointer items-center justify-between gap-4 py-1">
              <span className="text-[#172033] dark:text-slate-200">Community issue resolutions</span>
              <input
                type="checkbox"
                checked={preferences.notifyCommunityUpdates}
                onChange={(e) => updatePreferences({ notifyCommunityUpdates: e.target.checked })}
                className="h-4 w-4 rounded border-[#CBD5E1] text-[#4F46E5]"
              />
            </label>
          </div>
        </section>

        {/* Demo Dataset Reset */}
        <section className="flex flex-col justify-between gap-4 rounded-xl border border-[#E5E7EB] bg-white p-6 sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900">
          <div>
            <h2 className="text-sm font-semibold text-[#172033] dark:text-white">
              Reset Demonstration Dataset
            </h2>
            <p className="mt-1 text-xs text-[#64748B] dark:text-slate-400">
              Restore the initial 9 seeded complaints if you want a fresh starting state for another presentation.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setConfirmResetOpen(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-xs font-medium text-[#DC2626] transition-colors hover:bg-red-50 dark:border-red-900/60 dark:bg-slate-900 dark:text-red-400 whitespace-nowrap"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Reset Demo Data</span>
          </button>
        </section>
      </div>

      <ConfirmDialog
        open={confirmResetOpen}
        title="Reset demonstration dataset?"
        description="This will remove newly added test complaints and restore the initial seeded records in SQLite."
        confirmLabel="Reset Dataset"
        variant="danger"
        loading={resetting}
        onConfirm={handleReset}
        onCancel={() => setConfirmResetOpen(false)}
      />
    </AppShell>
  );
};
