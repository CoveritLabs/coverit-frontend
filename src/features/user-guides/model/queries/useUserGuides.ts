// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { useMutation, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@shared/config/queryKeys";
import { userGuidesApi } from "../../api/userGuidesApi";
import type {
  GenerateGuideParams,
  GenerateGuideResult,
  UserGuideApplication,
  UserGuideMode,
} from "../types/user-guides.types";

export function useUserGuideApplications(projectId: string | null) {
  const safeProjectId = projectId ?? "__missing__";

  return useQuery({
    queryKey: queryKeys.userGuides.applications(safeProjectId),
    queryFn: () => userGuidesApi.getApplications(safeProjectId),
    enabled: Boolean(projectId),
    placeholderData: [],
  });
}

export function useUserGuideVersions(projectId: string | null, applicationId: string | null) {
  const safeProjectId = projectId ?? "__missing__";
  const safeApplicationId = applicationId ?? "__missing__";

  return useQuery({
    queryKey: queryKeys.userGuides.versions(safeProjectId, safeApplicationId),
    queryFn: () => userGuidesApi.getVersions(safeProjectId, safeApplicationId),
    enabled: Boolean(projectId) && Boolean(applicationId),
    placeholderData: [],
  });
}

export function useUserGuideStates(
  projectId: string | null,
  applicationId: string | null,
  sourceId: string | null,
  mode: UserGuideMode = "automatic",
) {
  const safeProjectId = projectId ?? "__missing__";
  const safeApplicationId = applicationId ?? "__missing__";
  const safeSourceId = sourceId ?? "__missing__";

  return useQuery({
    queryKey: queryKeys.userGuides.states(safeProjectId, safeApplicationId, mode, safeSourceId),
    queryFn: () => userGuidesApi.getStates(safeProjectId, safeApplicationId, safeSourceId),
    enabled: Boolean(projectId) && Boolean(applicationId) && Boolean(sourceId),
    placeholderData: [],
  });
}

export function useUserGuideManualSessions(
  projectId: string | null,
  application: UserGuideApplication | null,
) {
  const safeProjectId = projectId ?? "__missing__";
  const safeApplicationId = application?.id ?? "__missing__";
  const versionIds = application?.versions?.map((version) => version.id) ?? [];

  return useQuery({
    queryKey: queryKeys.userGuides.manualSessions(safeProjectId, safeApplicationId, versionIds),
    queryFn: () => (application ? userGuidesApi.getManualSessions(safeProjectId, application) : Promise.resolve([])),
    enabled: Boolean(projectId) && Boolean(application),
    placeholderData: [],
  });
}

export function useGenerateUserGuide() {
  return useMutation<GenerateGuideResult, Error, GenerateGuideParams>({
    mutationFn: (params) => userGuidesApi.generateGuide(params),
  });
}
