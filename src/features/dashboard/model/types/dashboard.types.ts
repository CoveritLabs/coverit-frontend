// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

export interface ProjectDashboardVersionRef {
  id: string;
  version: string;
  applicationId: string;
  applicationName: string;
}

export interface ProjectCoverageSummary {
  percentage: number;
  coveredTransitions: number;
  totalTransitions: number;
  crawlSessionId?: string;
  calculatedAt?: string;
}

export interface ProjectRunStatistics {
  passedCount: number;
  warningCount: number;
  failedCount: number;
  reportedWarningCount: number;
  reportedFailedCount: number;
  totalRuns: number;
}

export interface ProjectLatestRun {
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
  createdAt: string;
}

export interface ProjectLatestCrawlSession {
  id: string;
  status: string;
  triggerType: string;
  applicationId: string;
  applicationName: string;
  versionId: string;
  version: string;
  stateCount: number;
  transitionCount: number;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
}

export interface ProjectLatestTestFlow {
  id: string;
  crawlSessionId: string;
  applicationId: string;
  applicationName: string;
  versionId: string;
  version: string;
  checkpointStateHash: string;
  checkpointUrl: string;
  isClipped: boolean;
  stepCount: number;
  createdAt: string;
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
  selectedVersion?: ProjectDashboardVersionRef;
  coverage: ProjectCoverageSummary;
  runStatistics: ProjectRunStatistics;
  latestRuns: ProjectLatestRun[];
  latestCrawlSessions: ProjectLatestCrawlSession[];
  latestTestFlows: ProjectLatestTestFlow[];
  recentActivities: ProjectActivity[];
}
