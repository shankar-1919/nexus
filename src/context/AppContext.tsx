import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type {
  AppNotification,
  Complaint,
  ComplaintLocation,
  Department,
  IssueCategory,
  Severity,
  UserPreferences,
  UserProfile,
  UserRole,
} from '../types/complaint';
import {
  CATEGORY_TO_DEPARTMENT,
  buildDeterministicAnalysis,
  generateComplaintId,
} from '../lib/workflow';
import { SEED_COMPLAINTS } from '../lib/seedData';
import { translations } from '../lib/i18n';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  tone: 'success' | 'info' | 'error';
}

interface SubmitComplaintInput {
  category: IssueCategory;
  description: string;
  photoUrl?: string;
  location: ComplaintLocation;
}

interface AppContextValue {
  complaints: Complaint[];
  loading: boolean;
  aiMode: 'gemini' | 'demo';
  role: UserRole | null;
  activeOfficerName: string;
  profile: UserProfile;
  preferences: UserPreferences;
  notifications: AppNotification[];
  toasts: ToastItem[];
  t: typeof translations.en;
  loginAsRole: (role: UserRole) => void;
  switchRole: (role: UserRole) => void;
  setActiveOfficerName: (name: string) => void;
  logout: () => void;
  updateProfile: (profile: UserProfile) => void;
  updatePreferences: (patch: Partial<UserPreferences>) => void;
  refreshComplaints: () => Promise<void>;
  uploadImage: (file: File) => Promise<string>;
  submitComplaint: (input: SubmitComplaintInput) => Promise<Complaint>;
  approveComplaint: (
    id: string,
    payload: { severity?: Severity; department?: Department; note?: string }
  ) => Promise<Complaint>;
  rejectComplaint: (id: string, reason: string) => Promise<Complaint>;
  assignComplaint: (
    id: string,
    payload: { officer: string; department: Department; dueDate?: string; instructions?: string }
  ) => Promise<Complaint>;
  updateComplaintFields: (
    id: string,
    payload: { severity?: Severity; department?: Department; note?: string }
  ) => Promise<Complaint>;
  updateTaskStatus: (id: string, status: 'Accepted' | 'In Progress', note?: string) => Promise<Complaint>;
  resolveComplaint: (
    id: string,
    payload: { note: string; completionPhotoUrl?: string }
  ) => Promise<Complaint>;
  submitFeedback: (id: string, payload: { rating: number; comment: string }) => Promise<Complaint>;
  reanalyzeComplaint: (id: string) => Promise<Complaint>;
  resetDemoData: () => Promise<void>;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  dismissToast: (id: string) => void;
  pushToast: (title: string, description?: string, tone?: ToastItem['tone']) => void;
}

const STORAGE_KEYS = {
  complaints: 'nexus_ai_complaints_v1',
  role: 'nexus_ai_role_v1',
  officer: 'nexus_ai_officer_v1',
  profile: 'nexus_ai_profile_v1',
  prefs: 'nexus_ai_prefs_v1',
  notifications: 'nexus_ai_notifications_v1',
};

const DEFAULT_PROFILE: UserProfile = {
  name: 'Aarav Rao',
  email: 'aarav.rao@demo-civic.org',
  phone: '+91 98480 01234',
  ward: 'Ward 93 — Banjara Hills',
};

const DEFAULT_PREFERENCES: UserPreferences = {
  language: 'en',
  theme: 'light',
  notifyStatusChanges: true,
  notifyAssignments: true,
  notifyCommunityUpdates: true,
};

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-seed-1',
    title: 'Field work started',
    message: 'NEX-2026-1001 (Pothole — Banjara Hills) is now In Progress with Officer Ravi Kumar.',
    timestamp: '2026-11-24T10:15:00.000Z',
    read: false,
    complaintId: 'NEX-2026-1001',
    type: 'info',
  },
  {
    id: 'notif-seed-2',
    title: 'Critical issue approved',
    message: 'NEX-2026-1003 (Water Leakage — Jubilee Hills) was approved and awaits field officer assignment.',
    timestamp: '2026-11-23T09:05:00.000Z',
    read: false,
    complaintId: 'NEX-2026-1003',
    type: 'warning',
  },
  {
    id: 'notif-seed-3',
    title: 'Complaint resolved',
    message: 'NEX-2026-1006 (Pothole — Ameerpet) has been marked resolved with completion evidence.',
    timestamp: '2026-11-19T16:40:00.000Z',
    read: true,
    complaintId: 'NEX-2026-1006',
    type: 'success',
  },
];

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [complaints, setComplaints] = useState<Complaint[]>(() =>
    readStorage<Complaint[]>(STORAGE_KEYS.complaints, SEED_COMPLAINTS)
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [aiMode, setAiMode] = useState<'gemini' | 'demo'>('demo');
  const [role, setRole] = useState<UserRole | null>(() =>
    readStorage<UserRole | null>(STORAGE_KEYS.role, null)
  );
  const [activeOfficerName, setActiveOfficerNameState] = useState<string>(() =>
    readStorage<string>(STORAGE_KEYS.officer, 'Ravi Kumar')
  );
  const [profile, setProfile] = useState<UserProfile>(() =>
    readStorage<UserProfile>(STORAGE_KEYS.profile, DEFAULT_PROFILE)
  );
  const [preferences, setPreferences] = useState<UserPreferences>(() =>
    readStorage<UserPreferences>(STORAGE_KEYS.prefs, DEFAULT_PREFERENCES)
  );
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    readStorage<AppNotification[]>(STORAGE_KEYS.notifications, INITIAL_NOTIFICATIONS)
  );
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Apply theme class cleanly to root html element
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', preferences.theme === 'dark');
    root.lang = preferences.language;
  }, [preferences.theme, preferences.language]);

  // Persist local cache
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.complaints, JSON.stringify(complaints));
    } catch {
      // ignore quota errors
    }
  }, [complaints]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.role, JSON.stringify(role));
    } catch {
      // ignore
    }
  }, [role]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.officer, JSON.stringify(activeOfficerName));
    } catch {
      // ignore
    }
  }, [activeOfficerName]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile));
    } catch {
      // ignore
    }
  }, [profile]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.prefs, JSON.stringify(preferences));
    } catch {
      // ignore
    }
  }, [preferences]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(notifications));
    } catch {
      // ignore
    }
  }, [notifications]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const pushToast = useCallback(
    (title: string, description?: string, tone: ToastItem['tone'] = 'info') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-1), { id, title, description, tone }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3200);
    },
    []
  );

  const addNotification = useCallback(
    (title: string, message: string, type: AppNotification['type'], complaintId?: string) => {
      const entry: AppNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title,
        message,
        timestamp: new Date().toISOString(),
        read: false,
        complaintId,
        type,
      };
      setNotifications((prev) => [entry, ...prev.slice(0, 24)]);
    },
    []
  );

  const refreshComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/complaints');
      if (!res.ok) throw new Error('Failed to reach backend');
      const data = (await res.json()) as { complaints: Complaint[]; aiMode?: 'gemini' | 'demo' };
      if (Array.isArray(data.complaints)) {
        setComplaints(data.complaints);
      }
      if (data.aiMode) {
        setAiMode(data.aiMode);
      }
    } catch {
      // Fall back gracefully to local cache / seed data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshComplaints();
  }, [refreshComplaints]);

  const upsertLocalComplaint = useCallback((updated: Complaint) => {
    setComplaints((prev) => {
      const exists = prev.some((c) => c.id === updated.id);
      if (exists) {
        return prev.map((c) => (c.id === updated.id ? updated : c));
      }
      return [updated, ...prev];
    });
  }, []);

  const loginAsRole = useCallback(
    (nextRole: UserRole) => {
      setRole(nextRole);
      const roleLabels: Record<UserRole, string> = {
        citizen: 'Citizen',
        admin: 'Administrator',
        officer: 'Field Officer',
      };
      pushToast(`Signed in as ${roleLabels[nextRole]}`, 'Demo Mode active — switch roles anytime.', 'success');
    },
    [pushToast]
  );

  const switchRole = useCallback(
    (nextRole: UserRole) => {
      setRole(nextRole);
      const roleLabels: Record<UserRole, string> = {
        citizen: 'Citizen',
        admin: 'Administrator',
        officer: 'Field Officer',
      };
      pushToast(`Switched to ${roleLabels[nextRole]} view`, 'Using shared live complaint records.', 'info');
    },
    [pushToast]
  );

  const setActiveOfficerName = useCallback((name: string) => {
    setActiveOfficerNameState(name);
  }, []);

  const logout = useCallback(() => {
    setRole(null);
    pushToast('Signed out', 'You can pick any demo role to sign back in.', 'info');
  }, [pushToast]);

  const updateProfile = useCallback(
    (next: UserProfile) => {
      setProfile(next);
      pushToast('Profile saved', 'Your profile details have been updated.', 'success');
    },
    [pushToast]
  );

  const updatePreferences = useCallback((patch: Partial<UserPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...patch }));
  }, []);

  const uploadImage = useCallback(async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || 'Upload failed');
      }
      const data = (await res.json()) as { url: string };
      return data.url;
    } catch {
      // Fallback to client-side DataURL so offline demo still previews & persists image
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Could not read the selected image file.'));
        reader.readAsDataURL(file);
      });
    }
  }, []);

  const submitComplaint = useCallback(
    async (input: SubmitComplaintInput): Promise<Complaint> => {
      const submittedBy = `${profile.name} (Demo Citizen)`;
      try {
        const res = await fetch('/api/complaints', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...input, submittedBy }),
        });
        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(err.error || 'Could not submit report');
        }
        const data = (await res.json()) as { complaint: Complaint };
        upsertLocalComplaint(data.complaint);
        addNotification(
          'Report submitted successfully',
          `${data.complaint.id} (${data.complaint.category}) completed initial triage and is awaiting review.`,
          'success',
          data.complaint.id
        );
        pushToast('Report submitted', `${data.complaint.id} has been recorded and analyzed.`, 'success');
        return data.complaint;
      } catch (err) {
        // Offline local fallback if API server cannot be reached
        if (err instanceof TypeError) {
          const id = generateComplaintId(complaints.map((c) => c.id));
          const now = new Date().toISOString();
          const analysis = buildDeterministicAnalysis({
            category: input.category,
            description: input.description,
            location: input.location,
            hasPhoto: Boolean(input.photoUrl),
            now,
          });
          const localComplaint: Complaint = {
            id,
            category: input.category,
            description: input.description || `${input.category} reported at ${input.location.address}.`,
            photoUrl: input.photoUrl,
            location: input.location,
            severity: analysis.severity,
            status: 'Awaiting Review',
            department: analysis.department || CATEGORY_TO_DEPARTMENT[input.category],
            submittedBy,
            submittedAt: now,
            updatedAt: now,
            isSeededDemo: false,
            aiAnalysis: analysis,
            timeline: [
              {
                id: `t-${id}-1`,
                stage: 'Submitted',
                status: 'Submitted',
                timestamp: now,
                description: `Citizen submitted ${input.category.toLowerCase()} report.`,
                actor: submittedBy,
              },
              {
                id: `t-${id}-2`,
                stage: 'AI Analysis Completed',
                status: 'AI Analysis Completed',
                timestamp: now,
                description: `Demo AI assessment recommended ${analysis.severity} severity and ${analysis.department}.`,
                actor: 'NEXUS AI (Demo Rules)',
              },
              {
                id: `t-${id}-3`,
                stage: 'Awaiting Review',
                status: 'Awaiting Review',
                timestamp: now,
                description: 'Queued for municipal administrator review.',
                actor: 'System',
              },
            ],
            notes: [],
          };
          upsertLocalComplaint(localComplaint);
          addNotification(
            'Report submitted (Local cache)',
            `${id} saved locally while backend is unreachable.`,
            'info',
            id
          );
          pushToast('Report submitted', `${id} saved locally.`, 'success');
          return localComplaint;
        }
        throw err;
      }
    },
    [addNotification, complaints, profile.name, pushToast, upsertLocalComplaint]
  );

  const callMutation = useCallback(
    async (
      url: string,
      method: 'POST' | 'PATCH',
      body: Record<string, unknown>,
      fallbackUpdater?: () => Complaint | null
    ): Promise<Complaint> => {
      try {
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(err.error || 'Action failed');
        }
        const data = (await res.json()) as { complaint: Complaint };
        upsertLocalComplaint(data.complaint);
        return data.complaint;
      } catch (err) {
        if (err instanceof TypeError && fallbackUpdater) {
          const local = fallbackUpdater();
          if (local) {
            upsertLocalComplaint(local);
            return local;
          }
        }
        throw err;
      }
    },
    [upsertLocalComplaint]
  );

  const approveComplaint = useCallback(
    async (id: string, payload: { severity?: Severity; department?: Department; note?: string }) => {
      const updated = await callMutation(`/api/complaints/${id}/approve`, 'POST', {
        ...payload,
        actor: 'Meera Iyer (Administrator)',
      });
      addNotification(
        'Report approved',
        `${updated.id} approved by Administrator and ready for officer assignment.`,
        'success',
        updated.id
      );
      pushToast('Report approved', `${updated.id} moved into assignment workflow.`, 'success');
      return updated;
    },
    [addNotification, callMutation, pushToast]
  );

  const rejectComplaint = useCallback(
    async (id: string, reason: string) => {
      const updated = await callMutation(`/api/complaints/${id}/reject`, 'POST', {
        reason,
        actor: 'Meera Iyer (Administrator)',
      });
      addNotification('Report rejected', `${updated.id} was marked Rejected during review.`, 'warning', updated.id);
      pushToast('Report rejected', `${updated.id} status updated.`, 'info');
      return updated;
    },
    [addNotification, callMutation, pushToast]
  );

  const assignComplaint = useCallback(
    async (
      id: string,
      payload: { officer: string; department: Department; dueDate?: string; instructions?: string }
    ) => {
      const updated = await callMutation(`/api/complaints/${id}/assign`, 'POST', {
        ...payload,
        actor: 'Meera Iyer (Administrator)',
      });
      addNotification(
        'Field officer assigned',
        `${updated.id} assigned to ${payload.officer} (${payload.department}).`,
        'info',
        updated.id
      );
      pushToast('Field officer assigned', `${payload.officer} has been assigned to ${updated.id}.`, 'success');
      return updated;
    },
    [addNotification, callMutation, pushToast]
  );

  const updateComplaintFields = useCallback(
    async (id: string, payload: { severity?: Severity; department?: Department; note?: string }) => {
      const author =
        role === 'citizen'
          ? `${profile.name} (Demo Citizen)`
          : role === 'officer'
          ? `${activeOfficerName} (Field Officer)`
          : 'Meera Iyer (Administrator)';
      const updated = await callMutation(`/api/complaints/${id}`, 'PATCH', {
        ...payload,
        role: role ?? 'admin',
        author,
      });
      pushToast('Complaint updated', `Changes saved to ${updated.id}.`, 'success');
      return updated;
    },
    [activeOfficerName, callMutation, profile.name, pushToast, role]
  );

  const updateTaskStatus = useCallback(
    async (id: string, status: 'Accepted' | 'In Progress', note?: string) => {
      const updated = await callMutation(`/api/complaints/${id}/task-status`, 'POST', {
        status,
        note,
        actor: `${activeOfficerName} (Field Officer)`,
      });
      addNotification(
        status === 'Accepted' ? 'Task accepted' : 'Work started',
        `${updated.id} updated to ${status} by ${activeOfficerName}.`,
        'info',
        updated.id
      );
      pushToast(
        status === 'Accepted' ? 'Task accepted' : 'Work started',
        `${updated.id} is now ${status}.`,
        'success'
      );
      return updated;
    },
    [activeOfficerName, addNotification, callMutation, pushToast]
  );

  const resolveComplaint = useCallback(
    async (id: string, payload: { note: string; completionPhotoUrl?: string }) => {
      const updated = await callMutation(`/api/complaints/${id}/resolve`, 'POST', {
        ...payload,
        actor: activeOfficerName,
      });
      addNotification(
        'Complaint resolved',
        `${updated.id} was marked Resolved by ${activeOfficerName}.`,
        'success',
        updated.id
      );
      pushToast('Complaint resolved', `${updated.id} closed with resolution evidence.`, 'success');
      return updated;
    },
    [activeOfficerName, addNotification, callMutation, pushToast]
  );

  const submitFeedback = useCallback(
    async (id: string, payload: { rating: number; comment: string }) => {
      const updated = await callMutation(`/api/complaints/${id}/feedback`, 'POST', payload);
      pushToast('Feedback submitted', `Thank you for rating the resolution of ${updated.id}.`, 'success');
      return updated;
    },
    [callMutation, pushToast]
  );

  const reanalyzeComplaint = useCallback(
    async (id: string) => {
      const updated = await callMutation(`/api/complaints/${id}/analyze`, 'POST', {});
      addNotification(
        'AI analysis completed',
        `Assessment refreshed for ${updated.id}.`,
        'info',
        updated.id
      );
      pushToast('Analysis refreshed', `Updated assessment for ${updated.id}.`, 'success');
      return updated;
    },
    [addNotification, callMutation, pushToast]
  );

  const resetDemoData = useCallback(async () => {
    try {
      const res = await fetch('/api/demo/reset', { method: 'POST' });
      if (res.ok) {
        const data = (await res.json()) as { complaints: Complaint[] };
        setComplaints(data.complaints);
      } else {
        setComplaints(SEED_COMPLAINTS);
      }
    } catch {
      setComplaints(SEED_COMPLAINTS);
    }
    setNotifications(INITIAL_NOTIFICATIONS);
    pushToast('Demo dataset restored', 'All sample complaints reset to initial state.', 'info');
  }, [pushToast]);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const t = useMemo(() => translations[preferences.language], [preferences.language]);

  const value: AppContextValue = {
    complaints,
    loading,
    aiMode,
    role,
    activeOfficerName,
    profile,
    preferences,
    notifications,
    toasts,
    t,
    loginAsRole,
    switchRole,
    setActiveOfficerName,
    logout,
    updateProfile,
    updatePreferences,
    refreshComplaints,
    uploadImage,
    submitComplaint,
    approveComplaint,
    rejectComplaint,
    assignComplaint,
    updateComplaintFields,
    updateTaskStatus,
    resolveComplaint,
    submitFeedback,
    reanalyzeComplaint,
    resetDemoData,
    markNotificationRead,
    markAllNotificationsRead,
    dismissToast,
    pushToast,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
