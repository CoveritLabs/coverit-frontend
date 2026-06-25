// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

export interface ProjectDashboardTotals {
  totalStates: number;
  totalTransitions: number;
  totalOnDemandSessions: number;
  totalRuns: number;
  passedCount: number;
  warningCount: number;
  failedCount: number;
  reportedWarningCount: number;
  reportedFailedCount: number;
}

export interface ProjectCoveragePoint {
  applicationId: string;
  applicationName: string;
  versionId: string;
  version: string;
  percentage: number;
  coveredTransitions: number;
  totalTransitions: number;
  totalStates: number;
  sessionCount: number;
  calculatedAt?: string;
}

export interface ProjectRunTrendPoint {
  id: string;
  runId: string;
  displayName: string;
  status: string;
  applicationId: string;
  applicationName: string;
  versionId?: string;
  version?: string;
  passedCount: number;
  warningCount: number;
  failedCount: number;
  durationMs?: number;
  createdAt: string;
}

export interface ProjectCrawlSessionTrendPoint {
  id: string;
  applicationId: string;
  applicationName: string;
  versionId: string;
  version: string;
  stateCount: number;
  transitionCount: number;
  createdAt: string;
  finishedAt?: string;
}

export interface ProjectTestFlowBreakdownPoint {
  type: string;
  count: number;
  totalSteps: number;
  generatedCount: number;
  staleCount: number;
  pendingCount: number;
}

export interface ProjectActivity {
  id: string;
  projectId: string;
  eventType: string;
  entityType: string;
  entityId?: string;
  message: string;
  actorUserId?: string;
  actorName?: string;
  actorEmail?: string;
  createdAt: string;
}

export interface ProjectDashboardResponse {
  totals: ProjectDashboardTotals;
  coverageByApplication: ProjectCoveragePoint[];
  coverageByVersion: ProjectCoveragePoint[];
  runTrend: ProjectRunTrendPoint[];
  crawlSessionTrend: ProjectCrawlSessionTrendPoint[];
  testFlowBreakdown: ProjectTestFlowBreakdownPoint[];
  recentActivities: ProjectActivity[];
}
