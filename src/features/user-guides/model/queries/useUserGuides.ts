// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { useMutation, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@shared/config/queryKeys";
import { userGuidesApi } from "../../api/userGuidesApi";
import type {
  GenerateGuideParams,
  GenerateGuideResult,
  RawUserGuideSession,
  UserGuideSession,
} from "../types/user-guides.types";

function toDisplaySessions(sessions: RawUserGuideSession[]): UserGuideSession[] {
  const chronological = [...sessions].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const sessionNumbers = new Map(chronological.map((session, index) => [session.id, index + 1]));

  return [...sessions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((session) => {
      const sessionNumber = sessionNumbers.get(session.id) ?? 0;
      return {
        ...session,
        sessionNumber,
        displayName: `Session #${sessionNumber}${session.label ? ` — ${session.label}` : ""}`,
      };
    });
}

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

export function useUserGuideSessions(
  projectId: string | null,
  applicationId: string | null,
  versionId: string | null,
) {
  const safeProjectId = projectId ?? "__missing__";
  const safeApplicationId = applicationId ?? "__missing__";
  const safeVersionId = versionId ?? "__missing__";

  return useQuery({
    queryKey: queryKeys.userGuides.sessions(safeProjectId, safeApplicationId, safeVersionId),
    queryFn: () => userGuidesApi.getSessions(safeProjectId, safeApplicationId, safeVersionId),
    enabled: Boolean(projectId) && Boolean(applicationId) && Boolean(versionId),
    placeholderData: [],
    select: toDisplaySessions,
  });
}

export function useUserGuideStates(
  projectId: string | null,
  applicationId: string | null,
  versionId: string | null,
  sessionId: string | null,
) {
  const safeProjectId = projectId ?? "__missing__";
  const safeApplicationId = applicationId ?? "__missing__";
  const safeVersionId = versionId ?? "__missing__";
  const safeSessionId = sessionId ?? "__missing__";

  return useQuery({
    queryKey: queryKeys.userGuides.states(safeProjectId, safeApplicationId, safeVersionId, safeSessionId),
    queryFn: () => userGuidesApi.getStates(safeProjectId, safeApplicationId, safeVersionId, safeSessionId),
    enabled: Boolean(projectId) && Boolean(applicationId) && Boolean(versionId) && Boolean(sessionId),
    placeholderData: [],
  });
}

export function useGenerateUserGuide() {
  return useMutation<GenerateGuideResult, Error, GenerateGuideParams>({
    mutationFn: (params) => userGuidesApi.generateGuide(params),
  });
}
