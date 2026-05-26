// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@config/queryKeys";
import { projectService } from "@services/project/projectService";
import type { ProjectResponse } from "@coveritlabs/contracts";

export function useProjects() {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: queryKeys.projects.lists(),
    queryFn: projectService.getProjects,
    placeholderData: () => queryClient.getQueryData<ProjectResponse[]>(queryKeys.projects.lists()) ?? [],
  });
}

export function useProject(projectId: string | null) {
  const queryClient = useQueryClient();
  const safeProjectId = projectId ?? "__missing__";

  return useQuery({
    queryKey: queryKeys.projects.detail(safeProjectId),
    queryFn: () => projectService.getProject(safeProjectId),
    enabled: Boolean(projectId),
    placeholderData: () =>
      projectId ? queryClient.getQueryData<ProjectResponse>(queryKeys.projects.detail(projectId)) : undefined,
  });
}
