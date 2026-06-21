// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@shared/config/queryKeys";
import type { Payload } from "@shared/types/common";
import { testFlowService } from "../../api/testFlowService";
import type { ListTestFlowsRequest, ListTestFlowsResponse } from "../types/test-flows.types";

const emptyTestFlowsResponse: ListTestFlowsResponse = { flows: [] };

export function useTestFlows(
  projectId: string | null,
  applicationId: string | null,
  filters: Payload<ListTestFlowsRequest> = {},
) {
  const queryClient = useQueryClient();
  const safeProjectId = projectId ?? "__missing__";
  const safeApplicationId = applicationId ?? "__missing__";

  return useQuery({
    queryKey: queryKeys.testFlows.list(safeProjectId, safeApplicationId, filters),
    queryFn: () => testFlowService.listTestFlows(safeProjectId, safeApplicationId, filters),
    enabled: Boolean(projectId) && Boolean(applicationId),
    placeholderData: () =>
      projectId && applicationId
        ? (queryClient.getQueryData<ListTestFlowsResponse>(
            queryKeys.testFlows.list(projectId, applicationId, filters),
          ) ?? emptyTestFlowsResponse)
        : emptyTestFlowsResponse,
  });
}
