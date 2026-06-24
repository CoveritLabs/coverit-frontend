// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@shared/config/queryKeys";
import { dashboardService } from "../../api/dashboardService";
import type { ProjectDashboardResponse } from "../types/dashboard.types";

export function useProjectDashboard(projectId: string | null, versionId?: string) {
  const queryClient = useQueryClient();
  const safeProjectId = projectId ?? "__missing__";
  const safeVersionId = versionId ?? "latest";

  return useQuery({
    queryKey: queryKeys.dashboard.detail(safeProjectId, safeVersionId),
    queryFn: () => dashboardService.getProjectDashboard(safeProjectId, versionId),
    enabled: Boolean(projectId),
    placeholderData: () =>
      projectId
        ? queryClient.getQueryData<ProjectDashboardResponse>(queryKeys.dashboard.detail(projectId, safeVersionId))
        : undefined,
  });
}
