// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
} from "@coveritlabs/contracts";
import { queryKeys } from "@shared/config/queryKeys";
import { toast } from "@shared/ui";
import type { Payload } from "@shared/types/common";
import { regressionRunService } from "../../api/regressionRunService";
import type {
  CreateScenarioIntegrationReportRequest,
  CreateScenarioIntegrationReportResponse,
  RegressionScenarioWithReports,
} from "../types/regression-runs.types";

type ListRegressionScenariosWithReportsResponse = Omit<ListRegressionScenariosResponse, "scenarios"> & {
  scenarios: RegressionScenarioWithReports[];
};

const emptyRunsResponse = { runs: [] } as unknown as ListRegressionRunsResponse;
const emptyScenariosResponse = { scenarios: [] } as unknown as ListRegressionScenariosResponse;
const emptyEventsResponse = { events: [] } as unknown as ListRegressionEventsResponse;
const emptyArtifactsResponse = {
  artifacts: [],
  artifactTree: [],
} as unknown as ListRegressionArtifactsResponse;

export function useRegressionRuns(
  projectId: string | null,
  applicationId: string | null,
  filters: Payload<ListRegressionRunsRequest> = {},
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
          ) ?? emptyRunsResponse)
        : emptyRunsResponse,
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
        ? (queryClient.getQueryData<ListRegressionScenariosWithReportsResponse>(
            queryKeys.regressionRuns.scenarios(projectId, applicationId, runId),
          ) ?? emptyScenariosResponse)
        : emptyScenariosResponse,
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
        ? queryClient.getQueryData<RegressionScenarioWithReports>(
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
  filters: Payload<ListRegressionEventsRequest> = {},
) {
  const queryClient = useQueryClient();
  const safeProjectId = projectId ?? "__missing__";
  const safeApplicationId = applicationId ?? "__missing__";
  const safeRunId = runId ?? "__missing__";
  const safeScenarioId = scenarioId ?? "__missing__";

  return useQuery({
    queryKey: queryKeys.regressionRuns.events(safeProjectId, safeApplicationId, safeRunId, safeScenarioId, filters),
    queryFn: () =>
      regressionRunService.listScenarioEvents(safeProjectId, safeApplicationId, safeRunId, safeScenarioId, filters),
    enabled: Boolean(projectId) && Boolean(applicationId) && Boolean(runId) && Boolean(scenarioId),
    placeholderData: () =>
      projectId && applicationId && runId && scenarioId
        ? (queryClient.getQueryData<ListRegressionEventsResponse>(
            queryKeys.regressionRuns.events(projectId, applicationId, runId, scenarioId, filters),
          ) ?? emptyEventsResponse)
        : emptyEventsResponse,
  });
}

export function useRegressionRunArtifacts(
  projectId: string | null,
  applicationId: string | null,
  runId: string | null,
  filters: Payload<ListRegressionArtifactsRequest> = {},
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
          ) ?? emptyArtifactsResponse)
        : emptyArtifactsResponse,
  });
}

export function useRegressionScenarioArtifacts(
  projectId: string | null,
  applicationId: string | null,
  runId: string | null,
  scenarioId: string | null,
  filters: Payload<ListRegressionArtifactsRequest> = {},
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
      regressionRunService.listScenarioArtifacts(safeProjectId, safeApplicationId, safeRunId, safeScenarioId, filters),
    enabled: Boolean(projectId) && Boolean(applicationId) && Boolean(runId) && Boolean(scenarioId),
    placeholderData: () =>
      projectId && applicationId && runId && scenarioId
        ? (queryClient.getQueryData<ListRegressionArtifactsResponse>(
            queryKeys.regressionRuns.scenarioArtifacts(projectId, applicationId, runId, scenarioId, filters),
          ) ?? emptyArtifactsResponse)
        : emptyArtifactsResponse,
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

export function useCreateScenarioIntegrationReport() {
  const queryClient = useQueryClient();

  return useMutation<
    CreateScenarioIntegrationReportResponse,
    Error,
    {
      projectId: string;
      applicationId: string;
      runId: string;
      scenarioId: string;
      provider: "jira";
      payload: CreateScenarioIntegrationReportRequest;
    }
  >({
    mutationFn: ({ projectId, applicationId, runId, scenarioId, provider, payload }) =>
      regressionRunService.createScenarioIntegrationReport(
        projectId,
        applicationId,
        runId,
        scenarioId,
        provider,
        payload,
      ),
    onSuccess: (_data, variables) => {
      toast.success("Scenario report queued");
      queryClient.invalidateQueries({
        queryKey: queryKeys.regressionRuns.scenarios(variables.projectId, variables.applicationId, variables.runId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.regressionRuns.scenario(
          variables.projectId,
          variables.applicationId,
          variables.runId,
          variables.scenarioId,
        ),
      });
    },
    onError: (error) => {
      toast.error("Failed to report scenario", error.message);
    },
  });
}
