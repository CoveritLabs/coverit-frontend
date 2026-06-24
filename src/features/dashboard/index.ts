// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

export { dashboardService } from "./api/dashboardService";
export { useProjectDashboard } from "./model/queries/useProjectDashboard";
export type {
  ProjectActivity,
  ProjectCoverageSummary,
  ProjectDashboardResponse,
  ProjectDashboardVersionRef,
  ProjectLatestCrawlSession,
  ProjectLatestRun,
  ProjectLatestTestFlow,
  ProjectRunStatistics,
} from "./model/types/dashboard.types";
