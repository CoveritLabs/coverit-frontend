// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ListRegressionArtifactsRequest,
  ListRegressionArtifactsResponse,
  ListRegressionEventsRequest,
  ListRegressionEventsResponse,
  ListRegressionRunsRequest,
  ListRegressionRunsResponse,
  ListRegressionScenariosResponse,
  RegressionArtifact as RegressionArtifactResponse,
  RegressionRun as RegressionRunResponse,
  RegressionScenario as RegressionScenarioResponse,
} from "@coveritlabs/contracts";
import { queryKeys } from "@shared/config/queryKeys";
import { regressionRunService } from "../../api/regressionRunService";

export function useRegressionRuns(
  projectId: string | null,
  applicationId: string | null,
  filters: ListRegressionRunsRequest = {},
) {
  const queryClient = useQueryClient();
  const safeProjectId = projectId ?? "__missing__";
  const safeApplicationId = applicationId ?? "__missing__";

  return useQuery({
    queryKey: queryKeys.regressionRuns.list(safeProjectId, safeApplicationId, filters),
    queryFn: () => regressionRunService.listRuns(safeProjectId, safeApplicationId, filters),
    enabled: Boolean(projectId) && Boolean(applicationId),
    placeholderData: () =>
      projectId && applicationId
        ? (queryClient.getQueryData<ListRegressionRunsResponse>(
            queryKeys.regressionRuns.list(projectId, applicationId, filters),
          ) ?? { runs: [] })
        : { runs: [] },
  });
}

export function useRegressionRun(projectId: string | null, applicationId: string | null, runId: string | null) {
  const queryClient = useQueryClient();
  const safeProjectId = projectId ?? "__missing__";
  const safeApplicationId = applicationId ?? "__missing__";
  const safeRunId = runId ?? "__missing__";

  return useQuery({
    queryKey: queryKeys.regressionRuns.detail(safeProjectId, safeApplicationId, safeRunId),
    queryFn: () => regressionRunService.getRun(safeProjectId, safeApplicationId, safeRunId),
    enabled: Boolean(projectId) && Boolean(applicationId) && Boolean(runId),
    placeholderData: () =>
      projectId && applicationId && runId
        ? queryClient.getQueryData<RegressionRunResponse>(
            queryKeys.regressionRuns.detail(projectId, applicationId, runId),
          )
        : undefined,
  });
}

export function useRegressionScenarios(projectId: string | null, applicationId: string | null, runId: string | null) {
  const queryClient = useQueryClient();
  const safeProjectId = projectId ?? "__missing__";
  const safeApplicationId = applicationId ?? "__missing__";
  const safeRunId = runId ?? "__missing__";

  return useQuery({
    queryKey: queryKeys.regressionRuns.scenarios(safeProjectId, safeApplicationId, safeRunId),
    queryFn: () => regressionRunService.listScenarios(safeProjectId, safeApplicationId, safeRunId),
    enabled: Boolean(projectId) && Boolean(applicationId) && Boolean(runId),
    placeholderData: () =>
      projectId && applicationId && runId
        ? (queryClient.getQueryData<ListRegressionScenariosResponse>(
            queryKeys.regressionRuns.scenarios(projectId, applicationId, runId),
          ) ?? { scenarios: [] })
        : { scenarios: [] },
  });
}

export function useRegressionScenario(
  projectId: string | null,
  applicationId: string | null,
  runId: string | null,
  scenarioId: string | null,
) {
  const queryClient = useQueryClient();
  const safeProjectId = projectId ?? "__missing__";
  const safeApplicationId = applicationId ?? "__missing__";
  const safeRunId = runId ?? "__missing__";
  const safeScenarioId = scenarioId ?? "__missing__";

  return useQuery({
    queryKey: queryKeys.regressionRuns.scenario(safeProjectId, safeApplicationId, safeRunId, safeScenarioId),
    queryFn: () => regressionRunService.getScenario(safeProjectId, safeApplicationId, safeRunId, safeScenarioId),
    enabled: Boolean(projectId) && Boolean(applicationId) && Boolean(runId) && Boolean(scenarioId),
    placeholderData: () =>
      projectId && applicationId && runId && scenarioId
        ? queryClient.getQueryData<RegressionScenarioResponse>(
            queryKeys.regressionRuns.scenario(projectId, applicationId, runId, scenarioId),
          )
        : undefined,
  });
}

export function useRegressionScenarioEvents(
  projectId: string | null,
  applicationId: string | null,
  runId: string | null,
  scenarioId: string | null,
  filters: ListRegressionEventsRequest = {},
) {
  const queryClient = useQueryClient();
  const safeProjectId = projectId ?? "__missing__";
  const safeApplicationId = applicationId ?? "__missing__";
  const safeRunId = runId ?? "__missing__";
  const safeScenarioId = scenarioId ?? "__missing__";

  return useQuery({
    queryKey: queryKeys.regressionRuns.events(
      safeProjectId,
      safeApplicationId,
      safeRunId,
      safeScenarioId,
      filters,
    ),
    queryFn: () =>
      regressionRunService.listScenarioEvents(safeProjectId, safeApplicationId, safeRunId, safeScenarioId, filters),
    enabled: Boolean(projectId) && Boolean(applicationId) && Boolean(runId) && Boolean(scenarioId),
    placeholderData: () =>
      projectId && applicationId && runId && scenarioId
        ? (queryClient.getQueryData<ListRegressionEventsResponse>(
            queryKeys.regressionRuns.events(projectId, applicationId, runId, scenarioId, filters),
          ) ?? { events: [] })
        : { events: [] },
  });
}

export function useRegressionRunArtifacts(
  projectId: string | null,
  applicationId: string | null,
  runId: string | null,
  filters: ListRegressionArtifactsRequest = {},
) {
  const queryClient = useQueryClient();
  const safeProjectId = projectId ?? "__missing__";
  const safeApplicationId = applicationId ?? "__missing__";
  const safeRunId = runId ?? "__missing__";

  return useQuery({
    queryKey: queryKeys.regressionRuns.artifacts(safeProjectId, safeApplicationId, safeRunId, filters),
    queryFn: () => regressionRunService.listRunArtifacts(safeProjectId, safeApplicationId, safeRunId, filters),
    enabled: Boolean(projectId) && Boolean(applicationId) && Boolean(runId),
    placeholderData: () =>
      projectId && applicationId && runId
        ? (queryClient.getQueryData<ListRegressionArtifactsResponse>(
            queryKeys.regressionRuns.artifacts(projectId, applicationId, runId, filters),
          ) ?? { artifacts: [], artifactTree: [] })
        : { artifacts: [], artifactTree: [] },
  });
}

export function useRegressionScenarioArtifacts(
  projectId: string | null,
  applicationId: string | null,
  runId: string | null,
  scenarioId: string | null,
  filters: ListRegressionArtifactsRequest = {},
) {
  const queryClient = useQueryClient();
  const safeProjectId = projectId ?? "__missing__";
  const safeApplicationId = applicationId ?? "__missing__";
  const safeRunId = runId ?? "__missing__";
  const safeScenarioId = scenarioId ?? "__missing__";

  return useQuery({
    queryKey: queryKeys.regressionRuns.scenarioArtifacts(
      safeProjectId,
      safeApplicationId,
      safeRunId,
      safeScenarioId,
      filters,
    ),
    queryFn: () =>
      regressionRunService.listScenarioArtifacts(
        safeProjectId,
        safeApplicationId,
        safeRunId,
        safeScenarioId,
        filters,
      ),
    enabled: Boolean(projectId) && Boolean(applicationId) && Boolean(runId) && Boolean(scenarioId),
    placeholderData: () =>
      projectId && applicationId && runId && scenarioId
        ? (queryClient.getQueryData<ListRegressionArtifactsResponse>(
            queryKeys.regressionRuns.scenarioArtifacts(projectId, applicationId, runId, scenarioId, filters),
          ) ?? { artifacts: [], artifactTree: [] })
        : { artifacts: [], artifactTree: [] },
  });
}

export function useRegressionArtifact(
  projectId: string | null,
  applicationId: string | null,
  runId: string | null,
  artifactId: string | null,
) {
  const queryClient = useQueryClient();
  const safeProjectId = projectId ?? "__missing__";
  const safeApplicationId = applicationId ?? "__missing__";
  const safeRunId = runId ?? "__missing__";
  const safeArtifactId = artifactId ?? "__missing__";

  return useQuery({
    queryKey: queryKeys.regressionRuns.artifact(safeProjectId, safeApplicationId, safeRunId, safeArtifactId),
    queryFn: () => regressionRunService.getArtifact(safeProjectId, safeApplicationId, safeRunId, safeArtifactId),
    enabled: Boolean(projectId) && Boolean(applicationId) && Boolean(runId) && Boolean(artifactId),
    placeholderData: () =>
      projectId && applicationId && runId && artifactId
        ? queryClient.getQueryData<RegressionArtifactResponse>(
            queryKeys.regressionRuns.artifact(projectId, applicationId, runId, artifactId),
          )
        : undefined,
  });
}
