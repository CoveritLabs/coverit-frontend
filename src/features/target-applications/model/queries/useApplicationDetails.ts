// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { queryKeys } from "@shared/config/queryKeys";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { applicationDetailsService } from "../../api/applicationDetailsService";
import type { CrawlSession } from "../types/applicationDetails.types";

export function useApplicationDetails(
  projectId: string | null,
  applicationId: string | null,
  versionId: string | null,
  versionCount = 0,
  applicationName?: string,
  applicationBaseUrl?: string,
  versionName?: string,
) {
  const safeProjectId = projectId ?? "__missing__";
  const safeApplicationId = applicationId ?? "__missing__";
  const safeVersionId = versionId ?? "__missing__";

  return useQuery({
    queryKey: queryKeys.targetApplications.applicationDetails(safeProjectId, safeApplicationId, safeVersionId),
    queryFn: () =>
      applicationDetailsService.getApplicationDetails({
        projectId: safeProjectId,
        applicationId: safeApplicationId,
        versionId,
        versionCount,
        applicationName: applicationName ?? "",
        applicationBaseUrl: applicationBaseUrl ?? "",
        versionName,
      }),
    enabled: Boolean(projectId) && Boolean(applicationId),
  });
}

export function useCrawlSessions(
  projectId: string | null,
  applicationId: string | null,
  versionId: string | null,
  applicationName?: string,
  applicationBaseUrl?: string,
  versionName?: string,
) {
  const safeProjectId = projectId ?? "__missing__";
  const safeApplicationId = applicationId ?? "__missing__";
  const safeVersionId = versionId ?? "__missing__";

  return useQuery({
    queryKey: queryKeys.targetApplications.crawlSessions(safeProjectId, safeApplicationId, safeVersionId),
    queryFn: () =>
      applicationDetailsService.getCrawlSessions({
        projectId: safeProjectId,
        applicationId: safeApplicationId,
        versionId: safeVersionId,
        applicationName: applicationName ?? "",
        applicationBaseUrl: applicationBaseUrl ?? "",
        versionName,
      }),
    enabled: Boolean(projectId) && Boolean(applicationId) && Boolean(versionId),
  });
}

export function useCrawlSession(
  projectId: string | null,
  applicationId: string | null,
  versionId: string | null,
  sessionId: string | null,
  applicationName?: string,
  applicationBaseUrl?: string,
  versionName?: string,
) {
  const queryClient = useQueryClient();
  const safeProjectId = projectId ?? "__missing__";
  const safeApplicationId = applicationId ?? "__missing__";
  const safeVersionId = versionId ?? "__missing__";
  const safeSessionId = sessionId ?? "__missing__";

  return useQuery({
    queryKey: queryKeys.targetApplications.crawlSession(
      safeProjectId,
      safeApplicationId,
      safeVersionId,
      safeSessionId,
    ),
    queryFn: () =>
      applicationDetailsService.getCrawlSession({
        projectId: safeProjectId,
        applicationId: safeApplicationId,
        versionId: safeVersionId,
        sessionId: safeSessionId,
        applicationName: applicationName ?? "",
        applicationBaseUrl: applicationBaseUrl ?? "",
        versionName,
      }),
    enabled: Boolean(projectId) && Boolean(applicationId) && Boolean(versionId) && Boolean(sessionId),
    placeholderData: () => {
      if (!projectId || !applicationId || !versionId || !sessionId) return undefined;
      const sessions = queryClient.getQueryData<CrawlSession[]>(
        queryKeys.targetApplications.crawlSessions(projectId, applicationId, versionId),
      );
      return sessions?.find((session) => session.id === sessionId);
    },
  });
}

export function useRegressionConfig(projectId: string | null, applicationId: string | null) {
  const safeProjectId = projectId ?? "__missing__";
  const safeApplicationId = applicationId ?? "__missing__";

  return useQuery({
    queryKey: queryKeys.targetApplications.regressionConfig(safeProjectId, safeApplicationId),
    queryFn: () => applicationDetailsService.getRegressionConfig(safeProjectId, safeApplicationId),
    enabled: Boolean(projectId) && Boolean(applicationId),
  });
}

export function useCrawlSchedules(projectId: string | null, applicationId: string | null) {
  const safeProjectId = projectId ?? "__missing__";
  const safeApplicationId = applicationId ?? "__missing__";

  return useQuery({
    queryKey: queryKeys.targetApplications.crawlSchedules(safeProjectId, safeApplicationId),
    queryFn: () => applicationDetailsService.getSchedules(safeProjectId, safeApplicationId),
    enabled: Boolean(projectId) && Boolean(applicationId),
  });
}
