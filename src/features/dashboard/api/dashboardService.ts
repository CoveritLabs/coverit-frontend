// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import type { ProjectDashboardResponse } from "@coveritlabs/contracts";
import { apiClient } from "@shared/api/client";

export const dashboardService = {
  async getProjectDashboard(projectId: string, versionId?: string): Promise<ProjectDashboardResponse> {
    const res = await apiClient.get<ProjectDashboardResponse>(`projects/${projectId}/dashboard`, {
      params: versionId ? { versionId } : undefined,
    });
    return res.data;
  },
};
