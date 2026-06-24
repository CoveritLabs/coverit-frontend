// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { apiClient } from "@shared/api/client";
import type { ProjectDashboardResponse } from "../model/types/dashboard.types";

export const dashboardService = {
  async getProjectDashboard(projectId: string): Promise<ProjectDashboardResponse> {
    const res = await apiClient.get<ProjectDashboardResponse>(`projects/${projectId}/dashboard`);
    return res.data;
  },
};
