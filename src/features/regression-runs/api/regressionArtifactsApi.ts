// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { apiClient } from "@shared/api/client";
import type {
  ListRegressionArtifactsRequest,
  ListRegressionArtifactsResponse,
  RegressionArtifact as RegressionArtifactResponse,
} from "@coveritlabs/contracts";
import type { Payload } from "@shared/types/common";

export async function listRunArtifacts(
  projectId: string,
  applicationId: string,
  runId: string,
  params: Payload<ListRegressionArtifactsRequest> = {},
): Promise<ListRegressionArtifactsResponse> {
  const res = await apiClient.get<ListRegressionArtifactsResponse>(
    `projects/${projectId}/target-applications/${applicationId}/runs/${runId}/artifacts`,
    { params },
  );
  return res.data;
}

export async function listScenarioArtifacts(
  projectId: string,
  applicationId: string,
  runId: string,
  scenarioId: string,
  params: Payload<ListRegressionArtifactsRequest> = {},
): Promise<ListRegressionArtifactsResponse> {
  const res = await apiClient.get<ListRegressionArtifactsResponse>(
    `projects/${projectId}/target-applications/${applicationId}/runs/${runId}/scenarios/${scenarioId}/artifacts`,
    { params },
  );
  return res.data;
}

export async function getArtifact(
  projectId: string,
  applicationId: string,
  runId: string,
  artifactId: string,
): Promise<RegressionArtifactResponse> {
  const res = await apiClient.get<RegressionArtifactResponse>(
    `projects/${projectId}/target-applications/${applicationId}/runs/${runId}/artifacts/${artifactId}`,
  );
  return res.data;
}
