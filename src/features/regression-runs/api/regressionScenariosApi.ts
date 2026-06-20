// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { apiClient } from "@shared/api/client";
import type {
  ListRegressionEventsRequest,
  ListRegressionEventsResponse,
  ListRegressionScenariosResponse,
} from "@coveritlabs/contracts";
import type { Payload } from "@shared/types/common";
import type {
  CreateScenarioIntegrationReportRequest,
  CreateScenarioIntegrationReportResponse,
  RegressionScenarioWithReports,
} from "../model/types/regression-runs.types";

export async function listScenarios(
  projectId: string,
  applicationId: string,
  runId: string,
): Promise<ListRegressionScenariosResponse> {
  const res = await apiClient.get<ListRegressionScenariosResponse>(
    `projects/${projectId}/target-applications/${applicationId}/runs/${runId}/scenarios`,
  );
  return res.data;
}

export async function getScenario(
  projectId: string,
  applicationId: string,
  runId: string,
  scenarioId: string,
): Promise<RegressionScenarioWithReports> {
  const res = await apiClient.get<RegressionScenarioWithReports>(
    `projects/${projectId}/target-applications/${applicationId}/runs/${runId}/scenarios/${scenarioId}`,
  );
  return res.data;
}

export async function listScenarioEvents(
  projectId: string,
  applicationId: string,
  runId: string,
  scenarioId: string,
  params: Payload<ListRegressionEventsRequest> = {},
): Promise<ListRegressionEventsResponse> {
  const res = await apiClient.get<ListRegressionEventsResponse>(
    `projects/${projectId}/target-applications/${applicationId}/runs/${runId}/scenarios/${scenarioId}/events`,
    { params },
  );
  return res.data;
}

export async function createScenarioIntegrationReport(
  projectId: string,
  applicationId: string,
  runId: string,
  scenarioId: string,
  provider: "jira",
  payload: CreateScenarioIntegrationReportRequest,
): Promise<CreateScenarioIntegrationReportResponse> {
  const res = await apiClient.post<CreateScenarioIntegrationReportResponse>(
    `projects/${projectId}/target-applications/${applicationId}/runs/${runId}/scenarios/${scenarioId}/reports/${provider}`,
    payload,
  );
  return res.data;
}
