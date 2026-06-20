// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { apiClient } from "@shared/api/client";
import type {
  ListRegressionEventsRequest,
  ListRegressionEventsResponse,
  ListRegressionScenariosResponse,
  RegressionScenario as RegressionScenarioResponse,
} from "@coveritlabs/contracts";
import type { Payload } from "@shared/types/common";

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
): Promise<RegressionScenarioResponse> {
  const res = await apiClient.get<RegressionScenarioResponse>(
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
