// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { apiClient } from "@shared/api/client";
import type { Payload } from "@shared/types/common";
import type { ListTestFlowsRequest, ListTestFlowsResponse } from "../model/types/test-flows.types";

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
};
