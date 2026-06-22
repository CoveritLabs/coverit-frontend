// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { apiClient } from "@shared/api/client";
import type { Payload } from "@shared/types/common";
import type {
  GenerateTestFlowRequest,
  GenerateTestFlowResponse,
  ListTestFlowsRequest,
  ListTestFlowsResponse,
  RegressionCodebaseOption,
} from "../model/types/test-flows.types";

export const testFlowService = {
  async listTestFlows(
    projectId: string,
    applicationId: string,
    params: Payload<ListTestFlowsRequest> = {},
  ): Promise<ListTestFlowsResponse> {
    const res = await apiClient.get<ListTestFlowsResponse>(
      `projects/${projectId}/target-applications/${applicationId}/test-flows`,
      { params },
    );
    return res.data;
  },

  async generateTestFlow(
    projectId: string,
    applicationId: string,
    flowId: string,
    payload: GenerateTestFlowRequest,
  ): Promise<GenerateTestFlowResponse> {
    const res = await apiClient.post<GenerateTestFlowResponse>(
      `projects/${projectId}/target-applications/${applicationId}/test-flows/${flowId}/generate`,
      payload,
    );
    return res.data;
  },

  async listRegressionCodebases(projectId: string, applicationId: string): Promise<RegressionCodebaseOption[]> {
    const res = await apiClient.get<RegressionCodebaseOption[]>(
      `projects/${projectId}/target-applications/${applicationId}/regression-codebases`,
    );
    return res.data;
  },
};
