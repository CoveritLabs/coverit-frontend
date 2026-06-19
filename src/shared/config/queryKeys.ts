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
  events: (projectId: string, applicationId: string, runId: string, scenarioId: string, filters: Record<string, unknown>) =>
    [...regressionRunKeys.all, "events", projectId, applicationId, runId, scenarioId, filters] as const,
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

const integrationKeys = {
  all: ["integrations"] as const,
  status: (projectId: string, provider: string) => [...integrationKeys.all, "status", projectId, provider] as const,
};

export const queryKeys = {
  projects: projectKeys,
  targetApplications: targetApplicationKeys,
  regressionRuns: regressionRunKeys,
  integrations: integrationKeys,
};
