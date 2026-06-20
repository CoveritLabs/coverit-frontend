// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@shared/config/queryKeys";
import { targetApplicationService } from "../../api/targetApplicationService";
import type { TargetApplicationResponse } from "@coveritlabs/contracts";

export function useTargetApplications(projectId: string | null) {
  const queryClient = useQueryClient();
  const safeProjectId = projectId ?? "__missing__";

  return useQuery({
    queryKey: queryKeys.targetApplications.lists(safeProjectId),
    queryFn: () => targetApplicationService.getTargetApplications(safeProjectId),
    enabled: Boolean(projectId),
    placeholderData: () =>
      projectId
        ? (queryClient.getQueryData<TargetApplicationResponse[]>(queryKeys.targetApplications.lists(projectId)) ?? [])
        : [],
  });
}

export function useTargetApplication(projectId: string | null, applicationId: string | null) {
  const queryClient = useQueryClient();
  const safeProjectId = projectId ?? "__missing__";
  const safeApplicationId = applicationId ?? "__missing__";

  return useQuery({
    queryKey: queryKeys.targetApplications.detail(safeProjectId, safeApplicationId),
    queryFn: () => targetApplicationService.getTargetApplication(safeProjectId, safeApplicationId),
    enabled: Boolean(projectId) && Boolean(applicationId),
    placeholderData: () =>
      projectId && applicationId
        ? queryClient.getQueryData<TargetApplicationResponse>(
            queryKeys.targetApplications.detail(projectId, applicationId),
          )
        : undefined,
  });
}
