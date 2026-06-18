// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { apiClient } from "@shared/api/client";
import type {
  ListRegressionRunsRequest,
  ListRegressionRunsResponse,
  RegressionRun as RegressionRunResponse,
} from "@coveritlabs/contracts";
import type { Payload } from "@shared/types/common";

export async function listRuns(
  projectId: string,
  applicationId: string,
  params: Payload<ListRegressionRunsRequest> = {},
): Promise<ListRegressionRunsResponse> {
  const res = await apiClient.get<ListRegressionRunsResponse>(
    `projects/${projectId}/target-applications/${applicationId}/runs`,
    { params },
  );
  return res.data;
}

export async function getRun(projectId: string, applicationId: string, runId: string): Promise<RegressionRunResponse> {
  const res = await apiClient.get<RegressionRunResponse>(
    `projects/${projectId}/target-applications/${applicationId}/runs/${runId}`,
  );
  return res.data;
}
