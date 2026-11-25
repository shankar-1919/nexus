export type UserRole = 'citizen' | 'admin' | 'officer';

export type IssueCategory =
  | 'Pothole'
  | 'Garbage Overflow'
  | 'Water Leakage'
  | 'Damaged Road'
  | 'Broken Streetlight'
  | 'Drainage Problem'
  | 'Other';

export type Severity = 'Low' | 'Medium' | 'High' | 'Critical';

export type ComplaintStatus =
  | 'Submitted'
  | 'AI Analysis Completed'
  | 'Awaiting Review'
  | 'Approved'
  | 'Assigned'
  | 'Accepted'
  | 'In Progress'
  | 'Resolved'
  | 'Rejected';

export type Department =
  | 'Road Maintenance Department'
  | 'Sanitation & Waste Management'
  | 'Water Supply & Pipelines'
  | 'Street Lighting & Electrical'
  | 'Stormwater & Drainage'
  | 'Civic Infrastructure General';

export type Language = 'en' | 'te';

export interface AgentStep {
  id: 'detection' | 'severity' | 'location' | 'department' | 'response';
  name: string;
  status: 'completed' | 'pending' | 'awaiting_human';
  output: string;
}

export interface AIAnalysis {
  mode: 'gemini' | 'demo';
  identifiedIssue: string;
  severity: Severity;
  summary: string;
  recommendedAction: string;
  department: Department;
  confidence: number | null;
  analyzedAt: string;
  disclaimer: string;
  agents: AgentStep[];
}

export interface TimelineEntry {
  id: string;
  stage: string;
  status: ComplaintStatus;
  timestamp: string;
  description: string;
  actor: string;
}

export interface AdminNote {
  id: string;
  author: string;
  role: UserRole;
  text: string;
  timestamp: string;
}

export interface ResolutionDetails {
  note: string;
  completionPhotoUrl?: string;
  resolvedBy: string;
  resolvedAt: string;
}

export interface CitizenFeedback {
  rating: number;
  comment: string;
  submittedAt: string;
}

export interface ComplaintLocation {
  address: string;
  area: string;
  lat: number;
  lng: number;
  source: 'manual' | 'map' | 'gps' | 'demo';
}

export interface Complaint {
  id: string;
  category: IssueCategory;
  description: string;
  photoUrl?: string;
  location: ComplaintLocation;
  severity: Severity;
  status: ComplaintStatus;
  department: Department;
  submittedBy: string;
  submittedAt: string;
  updatedAt: string;
  assignedOfficer?: string;
  dueDate?: string;
  instructions?: string;
  isSeededDemo?: boolean;
  aiAnalysis: AIAnalysis;
  timeline: TimelineEntry[];
  notes: AdminNote[];
  resolution?: ResolutionDetails;
  feedback?: CitizenFeedback;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  complaintId?: string;
  type: 'info' | 'success' | 'warning';
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  ward: string;
}

export interface UserPreferences {
  language: Language;
  theme: 'light' | 'dark';
  notifyStatusChanges: boolean;
  notifyAssignments: boolean;
  notifyCommunityUpdates: boolean;
}

export interface FieldOfficerOption {
  id: string;
  name: string;
  department: Department;
  zone: string;
}

export interface DashboardKPIs {
  total: number;
  submitted: number;
  pendingReview: number;
  critical: number;
  activeAssignments: number;
  inProgress: number;
  resolved: number;
  rejected: number;
}
