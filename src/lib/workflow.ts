import type {
  AIAnalysis,
  AgentStep,
  Complaint,
  ComplaintLocation,
  ComplaintStatus,
  DashboardKPIs,
  Department,
  FieldOfficerOption,
  IssueCategory,
  Severity,
} from '../types/complaint.ts';

export const ISSUE_CATEGORIES: IssueCategory[] = [
  'Pothole',
  'Garbage Overflow',
  'Water Leakage',
  'Damaged Road',
  'Broken Streetlight',
  'Drainage Problem',
  'Other',
];

export const DEPARTMENTS: Department[] = [
  'Road Maintenance Department',
  'Sanitation & Waste Management',
  'Water Supply & Pipelines',
  'Street Lighting & Electrical',
  'Stormwater & Drainage',
  'Civic Infrastructure General',
];

export const FIELD_OFFICERS: FieldOfficerOption[] = [
  {
    id: 'off-1',
    name: 'Ravi Kumar',
    department: 'Road Maintenance Department',
    zone: 'Central & West Zone',
  },
  {
    id: 'off-2',
    name: 'Priya Sharma',
    department: 'Water Supply & Pipelines',
    zone: 'North & Central Zone',
  },
  {
    id: 'off-3',
    name: 'Suresh Reddy',
    department: 'Sanitation & Waste Management',
    zone: 'East & Residential Zone',
  },
  {
    id: 'off-4',
    name: 'Anitha Nair',
    department: 'Street Lighting & Electrical',
    zone: 'South & IT Corridor',
  },
  {
    id: 'off-5',
    name: 'Vikram Patel',
    department: 'Stormwater & Drainage',
    zone: 'All Zones',
  },
];

export const CATEGORY_TO_DEPARTMENT: Record<IssueCategory, Department> = {
  Pothole: 'Road Maintenance Department',
  'Garbage Overflow': 'Sanitation & Waste Management',
  'Water Leakage': 'Water Supply & Pipelines',
  'Damaged Road': 'Road Maintenance Department',
  'Broken Streetlight': 'Street Lighting & Electrical',
  'Drainage Problem': 'Stormwater & Drainage',
  Other: 'Civic Infrastructure General',
};

export const TIMELINE_STAGES: { key: ComplaintStatus; label: string }[] = [
  { key: 'Submitted', label: 'Submitted' },
  { key: 'AI Analysis Completed', label: 'AI Analysis Completed' },
  { key: 'Awaiting Review', label: 'Awaiting Review' },
  { key: 'Approved', label: 'Approved' },
  { key: 'Assigned', label: 'Assigned' },
  { key: 'In Progress', label: 'In Progress' },
  { key: 'Resolved', label: 'Resolved' },
];

export function generateComplaintId(existingIds: string[], year = 2026): string {
  const prefix = `NEX-${year}-`;
  let maxNum = 1000;
  for (const id of existingIds) {
    if (id.startsWith(prefix)) {
      const parsed = Number.parseInt(id.slice(prefix.length), 10);
      if (!Number.isNaN(parsed) && parsed > maxNum) {
        maxNum = parsed;
      }
    }
  }
  return `${prefix}${maxNum + 1}`;
}

export function inferDeterministicSeverity(
  category: IssueCategory,
  description: string
): Severity {
  const text = description.toLowerCase();

  const criticalKeywords = [
    'flood',
    'burst',
    'major leak',
    'accident',
    'collapse',
    'sinkhole',
    'live wire',
    'spark',
    'blocked highway',
    'emergency',
    'sewage overflow',
    'continuous water',
    'danger',
  ];
  const highKeywords = [
    'deep',
    'busy junction',
    'main road',
    'school',
    'hospital',
    'heavy traffic',
    'large',
    'overflowing',
    'pitch dark',
    'severe',
    'multiple',
  ];
  const lowKeywords = ['minor', 'small', 'slight', 'cosmetic', 'faded', 'occasional'];

  if (criticalKeywords.some((k) => text.includes(k))) return 'Critical';
  if (highKeywords.some((k) => text.includes(k))) return 'High';
  if (lowKeywords.some((k) => text.includes(k))) return 'Low';

  switch (category) {
    case 'Water Leakage':
    case 'Drainage Problem':
      return 'High';
    case 'Pothole':
    case 'Damaged Road':
      return 'High';
    case 'Garbage Overflow':
    case 'Broken Streetlight':
      return 'Medium';
    default:
      return 'Medium';
  }
}

export function buildDeterministicAnalysis(input: {
  category: IssueCategory;
  description: string;
  location: ComplaintLocation;
  hasPhoto: boolean;
  now?: string;
}): AIAnalysis {
  const timestamp = input.now ?? new Date().toISOString();
  const severity = inferDeterministicSeverity(input.category, input.description);
  const department = CATEGORY_TO_DEPARTMENT[input.category];

  const issueLabels: Record<IssueCategory, string> = {
    Pothole: 'Road surface pothole',
    'Garbage Overflow': 'Municipal waste accumulation and bin overflow',
    'Water Leakage': 'Active municipal water pipeline leakage',
    'Damaged Road': 'Deteriorated asphalt and uneven roadway surface',
    'Broken Streetlight': 'Non-functional public street lighting fixture',
    'Drainage Problem': 'Blocked stormwater drainage channel',
    Other: 'General public infrastructure issue',
  };

  const summaryMap: Record<IssueCategory, string> = {
    Pothole:
      'Reported pavement cavity may impede vehicle movement and create safety hazards for two-wheelers and commuters.',
    'Garbage Overflow':
      'Accumulated solid waste around the collection point requires scheduled clearance to maintain neighborhood sanitation.',
    'Water Leakage':
      'Continuous water discharge can weaken surrounding road foundations and lead to significant municipal water loss.',
    'Damaged Road':
      'Cracked and uneven road surface slows traffic flow and increases risk of vehicle damage during peak hours.',
    'Broken Streetlight':
      'Reduced night visibility along this stretch affects pedestrian safety and residential street security.',
    'Drainage Problem':
      'Obstructed stormwater outlet risks localized waterlogging and stagnant water accumulation.',
    Other:
      'Reported civic maintenance concern requires field inspection to determine repair scope and materials.',
  };

  const actionMap: Record<IssueCategory, string> = {
    Pothole: 'Inspect road cavity depth, place safety cones if required, and schedule cold-mix or asphalt patching.',
    'Garbage Overflow': 'Dispatch collection vehicle to clear overflow and sanitize the surrounding bin perimeter.',
    'Water Leakage': 'Isolate affected distribution valve, inspect pipeline joint, and carry out pressure-tested sealing.',
    'Damaged Road': 'Survey affected road stretch, clear loose debris, and schedule resurfacing work crew.',
    'Broken Streetlight': 'Test luminaire ballast and pole wiring; replace LED fixture or faulty relay switch.',
    'Drainage Problem': 'Clear silt and solid debris from grate and flush connecting stormwater culvert.',
    Other: 'Assign local ward inspector to evaluate site condition and route to the relevant repair team.',
  };

  const priorityTimeline: Record<Severity, string> = {
    Critical: 'Immediate dispatch recommended (within 6 hours)',
    High: 'Priority inspection recommended (within 24 hours)',
    Medium: 'Standard municipal queue (within 48–72 hours)',
    Low: 'Routine maintenance cycle (within 5 business days)',
  };

  const agents: AgentStep[] = [
    {
      id: 'detection',
      name: 'Detection Agent',
      status: 'completed',
      output: input.hasPhoto
        ? `Classified as ${issueLabels[input.category]} from submitted report & attached image.`
        : `Classified as ${issueLabels[input.category]} from text report details.`,
    },
    {
      id: 'severity',
      name: 'Severity Agent',
      status: 'completed',
      output: `Estimated ${severity} priority based on issue type and reported impact.`,
    },
    {
      id: 'location',
      name: 'Location Agent',
      status: 'completed',
      output: `Mapped to ${input.location.area || input.location.address} (${input.location.lat.toFixed(4)}, ${input.location.lng.toFixed(4)}).`,
    },
    {
      id: 'department',
      name: 'Department Agent',
      status: 'completed',
      output: `Recommended routing to ${department}.`,
    },
    {
      id: 'response',
      name: 'Response Agent',
      status: 'completed',
      output: `${priorityTimeline[severity]}. Queued for human administrator review.`,
    },
  ];

  return {
    mode: 'demo',
    identifiedIssue: issueLabels[input.category],
    severity,
    summary: summaryMap[input.category],
    recommendedAction: actionMap[input.category],
    department,
    confidence: null,
    analyzedAt: timestamp,
    disclaimer: 'Demo AI Assessment — Generated using predefined demonstration rules. Requires human review.',
    agents,
  };
}

export function computeDashboardKPIs(complaints: Complaint[]): DashboardKPIs {
  let pendingReview = 0;
  let critical = 0;
  let activeAssignments = 0;
  let inProgress = 0;
  let resolved = 0;
  let rejected = 0;

  for (const c of complaints) {
    if (c.status === 'Awaiting Review' || c.status === 'Submitted' || c.status === 'AI Analysis Completed') {
      pendingReview += 1;
    }
    if (c.severity === 'Critical' && c.status !== 'Resolved' && c.status !== 'Rejected') {
      critical += 1;
    }
    if (c.status === 'Assigned' || c.status === 'Accepted' || c.status === 'In Progress') {
      activeAssignments += 1;
    }
    if (c.status === 'In Progress' || c.status === 'Accepted') {
      inProgress += 1;
    }
    if (c.status === 'Resolved') {
      resolved += 1;
    }
    if (c.status === 'Rejected') {
      rejected += 1;
    }
  }

  return {
    total: complaints.length,
    submitted: complaints.length,
    pendingReview,
    critical,
    activeAssignments,
    inProgress,
    resolved,
    rejected,
  };
}

export function getStageProgressIndex(status: ComplaintStatus): number {
  switch (status) {
    case 'Submitted':
      return 0;
    case 'AI Analysis Completed':
      return 1;
    case 'Awaiting Review':
      return 2;
    case 'Approved':
      return 3;
    case 'Assigned':
      return 4;
    case 'Accepted':
    case 'In Progress':
      return 5;
    case 'Resolved':
      return 6;
    case 'Rejected':
      return 2;
    default:
      return 0;
  }
}

export interface AnalyticsBreakdown {
  byCategory: { name: string; count: number }[];
  byStatus: { name: string; count: number }[];
  bySeverity: { name: Severity; count: number }[];
  resolutionTrend: { date: string; reported: number; resolved: number }[];
}

export function computeAnalytics(complaints: Complaint[]): AnalyticsBreakdown {
  const catCounts = new Map<string, number>();
  const statusCounts = new Map<string, number>();
  const sevCounts: Record<Severity, number> = {
    Low: 0,
    Medium: 0,
    High: 0,
    Critical: 0,
  };

  for (const c of complaints) {
    catCounts.set(c.category, (catCounts.get(c.category) ?? 0) + 1);
    const normalizedStatus = c.status === 'Accepted' ? 'In Progress' : c.status;
    statusCounts.set(normalizedStatus, (statusCounts.get(normalizedStatus) ?? 0) + 1);
    sevCounts[c.severity] = (sevCounts[c.severity] ?? 0) + 1;
  }

  const byCategory = Array.from(catCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const statusOrder: ComplaintStatus[] = [
    'Awaiting Review',
    'Approved',
    'Assigned',
    'In Progress',
    'Resolved',
    'Rejected',
  ];
  const byStatus = statusOrder
    .map((name) => ({ name, count: statusCounts.get(name) ?? 0 }))
    .filter((item) => item.count > 0);

  const bySeverity: { name: Severity; count: number }[] = [
    { name: 'Critical', count: sevCounts.Critical },
    { name: 'High', count: sevCounts.High },
    { name: 'Medium', count: sevCounts.Medium },
    { name: 'Low', count: sevCounts.Low },
  ];

  // Build chronological date trend from actual complaint timestamps
  const dayBuckets = new Map<string, { reported: number; resolved: number }>();
  for (const c of complaints) {
    const repDay = c.submittedAt.slice(0, 10);
    const bucket = dayBuckets.get(repDay) ?? { reported: 0, resolved: 0 };
    bucket.reported += 1;
    dayBuckets.set(repDay, bucket);

    if (c.status === 'Resolved') {
      const resDay = (c.resolution?.resolvedAt ?? c.updatedAt).slice(0, 10);
      const resBucket = dayBuckets.get(resDay) ?? { reported: 0, resolved: 0 };
      resBucket.resolved += 1;
      dayBuckets.set(resDay, resBucket);
    }
  }

  const resolutionTrend = Array.from(dayBuckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([isoDate, counts]) => ({
      date: formatShortDate(isoDate),
      reported: counts.reported,
      resolved: counts.resolved,
    }));

  return { byCategory, byStatus, bySeverity, resolutionTrend };
}

export interface DataInsight {
  id: string;
  title: string;
  detail: string;
  metric: string;
  tone: 'info' | 'warning' | 'critical' | 'success';
}

export function generateCommunityInsights(complaints: Complaint[]): {
  insights: DataInsight[];
  recommendations: { id: string; title: string; detail: string; department: string }[];
} {
  const kpis = computeDashboardKPIs(complaints);
  const analytics = computeAnalytics(complaints);
  const insights: DataInsight[] = [];

  const roadCount = complaints.filter(
    (c) => c.category === 'Pothole' || c.category === 'Damaged Road'
  ).length;
  if (roadCount > 0) {
    insights.push({
      id: 'ins-road',
      title: 'Road surface issues lead current reports',
      detail: `${roadCount} of ${complaints.length} active dataset reports involve potholes or deteriorated pavement requiring Road Maintenance inspection.`,
      metric: `${roadCount} reports`,
      tone: 'warning',
    });
  }

  if (kpis.pendingReview > 0) {
    insights.push({
      id: 'ins-review',
      title: 'Reports awaiting human verification',
      detail: `${kpis.pendingReview} submitted report${kpis.pendingReview === 1 ? '' : 's'} have completed initial triage and await administrator approval before dispatch.`,
      metric: `${kpis.pendingReview} pending`,
      tone: 'info',
    });
  }

  if (kpis.critical > 0) {
    const criticalAreas = complaints
      .filter((c) => c.severity === 'Critical' && c.status !== 'Resolved' && c.status !== 'Rejected')
      .map((c) => c.location.area)
      .slice(0, 2)
      .join(' & ');
    insights.push({
      id: 'ins-critical',
      title: 'Critical infrastructure incidents active',
      detail: `${kpis.critical} unresolved critical report${kpis.critical === 1 ? '' : 's'} detected in ${criticalAreas || 'monitored zones'} requiring immediate crew allocation.`,
      metric: `${kpis.critical} critical`,
      tone: 'critical',
    });
  }

  const streetlightCount = complaints.filter(
    (c) => c.category === 'Broken Streetlight' && c.status !== 'Resolved'
  ).length;
  if (streetlightCount > 0) {
    insights.push({
      id: 'ins-lights',
      title: 'Streetlight maintenance follow-up needed',
      detail: `${streetlightCount} unresolved lighting complaint${streetlightCount === 1 ? '' : 's'} remain open across residential corridors.`,
      metric: `${streetlightCount} open`,
      tone: 'info',
    });
  }

  const resolvedRate =
    complaints.length > 0 ? Math.round((kpis.resolved / complaints.length) * 100) : 0;
  insights.push({
    id: 'ins-resolution',
    title: 'Current resolution completion rate',
    detail: `${kpis.resolved} out of ${complaints.length} tracked complaints have been verified and marked resolved with field closure records.`,
    metric: `${resolvedRate}% resolved`,
    tone: 'success',
  });

  // Area concentration check
  const areaCounts = new Map<string, number>();
  for (const c of complaints) {
    if (c.status !== 'Resolved' && c.status !== 'Rejected') {
      areaCounts.set(c.location.area, (areaCounts.get(c.location.area) ?? 0) + 1);
    }
  }
  const topArea = Array.from(areaCounts.entries()).sort((a, b) => b[1] - a[1])[0];
  const topCategory = analytics.byCategory[0];

  const recommendations = [
    {
      id: 'rec-1',
      title: 'Prioritize unresolved critical incidents',
      detail:
        kpis.critical > 0
          ? `Review and dispatch field teams for ${kpis.critical} active critical report${kpis.critical === 1 ? '' : 's'} first.`
          : 'No unresolved critical incidents right now; continue processing high-severity queue.',
      department: 'Operations Command',
    },
    {
      id: 'rec-2',
      title: 'Clear pending human review queue',
      detail:
        kpis.pendingReview > 0
          ? `Verify ${kpis.pendingReview} report${kpis.pendingReview === 1 ? '' : 's'} currently in Awaiting Review so field officers can be assigned.`
          : 'All submitted reports have been reviewed by an administrator.',
      department: 'Admin Review Desk',
    },
    {
      id: 'rec-3',
      title: topArea
        ? `Coordinate nearby tasks in ${topArea[0]}`
        : 'Group nearby maintenance visits',
      detail: topArea
        ? `${topArea[0]} currently has ${topArea[1]} open report${topArea[1] === 1 ? '' : 's'}; batching field inspections reduces travel overhead.`
        : 'Assign adjacent ward tasks to a single field crew route where possible.',
      department: 'Field Dispatch',
    },
    {
      id: 'rec-4',
      title: topCategory
        ? `Allocate capacity for ${topCategory.name}`
        : 'Balance departmental workload',
      detail: topCategory
        ? `${topCategory.name} accounts for ${topCategory.count} reports in the dataset — ensure ${CATEGORY_TO_DEPARTMENT[topCategory.name as IssueCategory] ?? 'the lead department'} has active crew coverage.`
        : 'Monitor department backlogs weekly to keep turnaround steady.',
      department:
        topCategory
          ? CATEGORY_TO_DEPARTMENT[topCategory.name as IssueCategory] ?? 'Civic Infrastructure General'
          : 'Civic Infrastructure General',
    },
  ];

  return { insights: insights.slice(0, 4), recommendations };
}

export interface ComplaintFilters {
  search: string;
  category: string;
  severity: string;
  status: string;
  hideResolved?: boolean;
  sortBy?: 'newest' | 'oldest' | 'severity';
}

const SEVERITY_RANK: Record<Severity, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

export function filterAndSortComplaints(
  complaints: Complaint[],
  filters: ComplaintFilters
): Complaint[] {
  const query = filters.search.trim().toLowerCase();

  const filtered = complaints.filter((c) => {
    if (filters.hideResolved && c.status === 'Resolved') return false;
    if (filters.category && filters.category !== 'All' && c.category !== filters.category) {
      return false;
    }
    if (filters.severity && filters.severity !== 'All' && c.severity !== filters.severity) {
      return false;
    }
    if (filters.status && filters.status !== 'All' && c.status !== filters.status) {
      return false;
    }
    if (query) {
      const haystack = [
        c.id,
        c.category,
        c.description,
        c.location.address,
        c.location.area,
        c.department,
        c.assignedOfficer ?? '',
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  const sortBy = filters.sortBy ?? 'newest';
  return [...filtered].sort((a, b) => {
    if (sortBy === 'oldest') {
      return a.submittedAt.localeCompare(b.submittedAt);
    }
    if (sortBy === 'severity') {
      const diff = SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];
      if (diff !== 0) return diff;
      return b.submittedAt.localeCompare(a.submittedAt);
    }
    return b.submittedAt.localeCompare(a.submittedAt);
  });
}

export function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
