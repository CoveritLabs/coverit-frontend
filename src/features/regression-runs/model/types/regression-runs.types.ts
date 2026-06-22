// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import type {
  CreateScenarioIntegrationReportRequest as ContractCreateScenarioIntegrationReportRequest,
  ScenarioIntegrationReport as ContractScenarioIntegrationReport,
  ListRegressionScenariosResponse,
  RegressionArtifact,
  RegressionRun,
  RegressionScenario,
  ScenarioIntegrationReportResponse as ContractScenarioIntegrationReportResponse,
} from "@coveritlabs/contracts";
import type { Payload } from "@shared/types/common";

export type RegressionRunStatusValue = RegressionRun["status"];
export type SearchParamStatus = RegressionRun["status"] | "all";
export type RegressionRunsView = "overview" | "statistics";
export type RegressionRunTab = "scenarios" | "artifacts";
export type RegressionScenarioTab = "events" | "artifacts";
export type ArtifactPreviewKind = "image" | "video" | "text" | "none";

export type ScenarioIntegrationReport = Payload<ContractScenarioIntegrationReport>;

export type RegressionScenarioWithReports = Payload<RegressionScenario> & {
  integrationReports?: ScenarioIntegrationReport[];
};

export type ListRegressionScenariosWithReportsResponse = Omit<
  Payload<ListRegressionScenariosResponse>,
  "scenarios"
> & {
  scenarios: RegressionScenarioWithReports[];
};

export type CreateScenarioIntegrationReportRequest = Payload<ContractCreateScenarioIntegrationReportRequest>;

export type CreateScenarioIntegrationReportResponse = Payload<ContractScenarioIntegrationReportResponse>;

export type RegressionRunListItem = RegressionRun & {
  versionName: string;
};

export interface RegressionRunsFiltersState {
  appId: string | null;
  versionId: string | null;
  status: SearchParamStatus;
  searchText: string;
}

export interface RegressionRunsStats {
  totalRuns: number;
  runningRuns: number;
  completedRuns: number;
  passedRuns: number;
  failedRuns: number;
  warningRuns: number;
  completedPassRate: number | null;
  totalPassedCount: number;
  totalWarningCount: number;
  totalFailedCount: number;
  averageDurationMs: number;
  medianDurationMs: number;
  p95DurationMs: number;
  slowestRun: RegressionRunListItem | null;
  averagePassedPerRun: number;
  averageWarningsPerRun: number;
  averageFailuresPerRun: number;
}

export interface RegressionRunsTrendPoint {
  label: string;
  runId: string;
  version: string;
  status: RegressionRun["status"];
  passed: number;
  failed: number;
  warnings: number;
  durationMs: number;
}

export interface RegressionRunsStatusPoint {
  name: string;
  value: number;
  color: string;
  percent: number;
}

export interface RegressionRunsResultPoint {
  name: "Pass" | "Warn" | "Fail";
  value: number;
  color: string;
  percent: number;
}

export interface RegressionRunsStatsModel {
  summary: RegressionRunsStats;
  trend: RegressionRunsTrendPoint[];
  statusDistribution: RegressionRunsStatusPoint[];
  resultBreakdown: RegressionRunsResultPoint[];
}

export interface RegressionRunsOverviewModel {
  selectedRun: RegressionRunListItem | null;
  selectedScenario: RegressionScenarioWithReports | null;
  runs: RegressionRunListItem[];
  scenarios: RegressionScenarioWithReports[];
  runArtifacts: RegressionArtifact[];
  scenarioArtifacts: RegressionArtifact[];
}
