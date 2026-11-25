import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDeterministicAnalysis,
  computeAnalytics,
  computeDashboardKPIs,
  filterAndSortComplaints,
  generateCommunityInsights,
  generateComplaintId,
  getStageProgressIndex,
  inferDeterministicSeverity,
} from './workflow';
import { SEED_COMPLAINTS } from './seedData';

test('generateComplaintId produces incrementing NEX-2026 IDs', () => {
  const next = generateComplaintId(['NEX-2026-1001', 'NEX-2026-1009', 'NEX-2026-1004']);
  assert.equal(next, 'NEX-2026-1010');
  assert.equal(generateComplaintId([]), 'NEX-2026-1001');
});

test('deterministic AI analysis never fabricates confidence scores and outputs 5 agents', () => {
  const analysis = buildDeterministicAnalysis({
    category: 'Pothole',
    description: 'Deep pothole near busy junction affecting vehicles',
    location: {
      address: 'Road No. 12, Banjara Hills',
      area: 'Banjara Hills',
      lat: 17.4126,
      lng: 78.4398,
      source: 'manual',
    },
    hasPhoto: true,
  });

  assert.equal(analysis.mode, 'demo');
  assert.equal(analysis.confidence, null);
  assert.equal(analysis.severity, 'High');
  assert.equal(analysis.department, 'Road Maintenance Department');
  assert.equal(analysis.agents.length, 5);
  assert.deepEqual(
    analysis.agents.map((a) => a.id),
    ['detection', 'severity', 'location', 'department', 'response']
  );
  assert.match(analysis.disclaimer, /Demo AI Assessment/);
});

test('severity inference escalates critical keywords accurately', () => {
  assert.equal(inferDeterministicSeverity('Water Leakage', 'Major burst pipe causing flood'), 'Critical');
  assert.equal(inferDeterministicSeverity('Broken Streetlight', 'Minor flickering lamp'), 'Low');
});

test('seeded dataset satisfies required counts and consistent KPI math', () => {
  assert.ok(SEED_COMPLAINTS.length >= 8);
  const kpis = computeDashboardKPIs(SEED_COMPLAINTS);
  assert.equal(kpis.total, SEED_COMPLAINTS.length);
  assert.equal(kpis.pendingReview, 3); // 1002, 1005, 1007
  assert.equal(kpis.resolved, 2); // 1006, 1008
  assert.equal(kpis.critical, 2); // 1003, 1009
  assert.equal(kpis.activeAssignments, 3); // 1001, 1004, 1009

  const analytics = computeAnalytics(SEED_COMPLAINTS);
  const categorySum = analytics.byCategory.reduce((acc, item) => acc + item.count, 0);
  assert.equal(categorySum, SEED_COMPLAINTS.length);

  const severitySum = analytics.bySeverity.reduce((acc, item) => acc + item.count, 0);
  assert.equal(severitySum, SEED_COMPLAINTS.length);
});

test('filtering and sorting complaints respects search, severity, and hideResolved', () => {
  const onlyActive = filterAndSortComplaints(SEED_COMPLAINTS, {
    search: '',
    category: 'All',
    severity: 'All',
    status: 'All',
    hideResolved: true,
  });
  assert.equal(onlyActive.length, SEED_COMPLAINTS.length - 2);

  const potholeSearch = filterAndSortComplaints(SEED_COMPLAINTS, {
    search: 'Banjara',
    category: 'Pothole',
    severity: 'All',
    status: 'All',
  });
  assert.equal(potholeSearch.length, 1);
  assert.equal(potholeSearch[0].id, 'NEX-2026-1001');

  const sortedBySev = filterAndSortComplaints(SEED_COMPLAINTS, {
    search: '',
    category: 'All',
    severity: 'All',
    status: 'All',
    sortBy: 'severity',
  });
  assert.equal(sortedBySev[0].severity, 'Critical');
});

test('timeline stage progress index maps every status cleanly', () => {
  assert.equal(getStageProgressIndex('Submitted'), 0);
  assert.equal(getStageProgressIndex('Awaiting Review'), 2);
  assert.equal(getStageProgressIndex('Approved'), 3);
  assert.equal(getStageProgressIndex('Assigned'), 4);
  assert.equal(getStageProgressIndex('In Progress'), 5);
  assert.equal(getStageProgressIndex('Resolved'), 6);
});

test('community insights derive directly from current dataset', () => {
  const { insights, recommendations } = generateCommunityInsights(SEED_COMPLAINTS);
  assert.ok(insights.length >= 3);
  assert.equal(recommendations.length, 4);
});
