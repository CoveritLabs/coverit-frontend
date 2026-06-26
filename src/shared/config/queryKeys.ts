// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

const projectKeys = {
  all: ["projects"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) => [...projectKeys.lists(), filters] as const,
  detail: (projectId: string) => [...projectKeys.all, "detail", projectId] as const,
};

const targetApplicationKeys = {
  all: ["target-applications"] as const,
  lists: (projectId: string) => [...targetApplicationKeys.all, "list", projectId] as const,
  detail: (projectId: string, applicationId: string) =>
    [...targetApplicationKeys.all, "detail", projectId, applicationId] as const,
  applicationDetails: (projectId: string, applicationId: string, versionId: string) =>
    [...targetApplicationKeys.all, "application-details", projectId, applicationId, versionId] as const,
  crawlSessions: (projectId: string, applicationId: string, versionId: string) =>
    [...targetApplicationKeys.all, "crawl-sessions", projectId, applicationId, versionId] as const,
  crawlSession: (projectId: string, applicationId: string, versionId: string, sessionId: string) =>
    [...targetApplicationKeys.all, "crawl-session", projectId, applicationId, versionId, sessionId] as const,
  regressionConfig: (projectId: string, applicationId: string) =>
    [...targetApplicationKeys.all, "regression-config", projectId, applicationId] as const,
  regressionCodebases: (projectId: string, applicationId: string) =>
    [...targetApplicationKeys.all, "regression-codebases", projectId, applicationId] as const,
  crawlSchedules: (projectId: string, applicationId: string) =>
    [...targetApplicationKeys.all, "crawl-schedules", projectId, applicationId] as const,
};

const regressionRunKeys = {
  all: ["regression-runs"] as const,
  lists: (projectId: string, applicationId: string) =>
    [...regressionRunKeys.all, "list", projectId, applicationId] as const,
  list: (projectId: string, applicationId: string, filters: Record<string, unknown>) =>
    [...regressionRunKeys.lists(projectId, applicationId), filters] as const,
  detail: (projectId: string, applicationId: string, runId: string) =>
    [...regressionRunKeys.all, "detail", projectId, applicationId, runId] as const,
  scenarios: (projectId: string, applicationId: string, runId: string) =>
    [...regressionRunKeys.all, "scenarios", projectId, applicationId, runId] as const,
  scenario: (projectId: string, applicationId: string, runId: string, scenarioId: string) =>
    [...regressionRunKeys.scenarios(projectId, applicationId, runId), "detail", scenarioId] as const,
  events: (
    projectId: string,
    applicationId: string,
    runId: string,
    scenarioId: string,
    filters: Record<string, unknown>,
  ) => [...regressionRunKeys.all, "events", projectId, applicationId, runId, scenarioId, filters] as const,
  artifacts: (projectId: string, applicationId: string, runId: string, filters: Record<string, unknown>) =>
    [...regressionRunKeys.all, "artifacts", projectId, applicationId, runId, filters] as const,
  scenarioArtifacts: (
    projectId: string,
    applicationId: string,
    runId: string,
    scenarioId: string,
    filters: Record<string, unknown>,
  ) => [...regressionRunKeys.all, "scenario-artifacts", projectId, applicationId, runId, scenarioId, filters] as const,
  artifact: (projectId: string, applicationId: string, runId: string, artifactId: string) =>
    [...regressionRunKeys.all, "artifact", projectId, applicationId, runId, artifactId] as const,
};

const testFlowKeys = {
  all: ["test-flows"] as const,
  lists: (projectId: string, applicationId: string) => [...testFlowKeys.all, "list", projectId, applicationId] as const,
  list: (projectId: string, applicationId: string, filters: Record<string, unknown>) =>
    [...testFlowKeys.lists(projectId, applicationId), filters] as const,
  editor: (projectId: string, applicationId: string, flowId: string) =>
    [...testFlowKeys.all, "editor", projectId, applicationId, flowId] as const,
};

const userGuideKeys = {
  all: ["user-guides"] as const,
  applications: (projectId: string) => [...userGuideKeys.all, "applications", projectId] as const,
  versions: (projectId: string, applicationId: string) =>
    [...userGuideKeys.all, "versions", projectId, applicationId] as const,
  manualSessions: (projectId: string, applicationId: string, versionIds: readonly string[]) =>
    [...userGuideKeys.all, "manual-sessions", projectId, applicationId, versionIds] as const,
  states: (projectId: string, applicationId: string, mode: string, sourceId: string) =>
    [...userGuideKeys.all, "states", projectId, applicationId, mode, sourceId] as const,
};

const integrationKeys = {
  all: ["integrations"] as const,
  status: (projectId: string, provider: string) => [...integrationKeys.all, "status", projectId, provider] as const,
  reportingOptions: (projectId: string, provider: string) =>
    [...integrationKeys.all, "reporting-options", projectId, provider] as const,
};

const dashboardKeys = {
  all: ["dashboard"] as const,
  detail: (projectId: string) => [...dashboardKeys.all, "detail", projectId] as const,
};

export const queryKeys = {
  projects: projectKeys,
  targetApplications: targetApplicationKeys,
  regressionRuns: regressionRunKeys,
  testFlows: testFlowKeys,
  userGuides: userGuideKeys,
  integrations: integrationKeys,
  dashboard: dashboardKeys,
};
