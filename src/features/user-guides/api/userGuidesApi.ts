// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { apiClient } from "@shared/api/client";
import { applicationDetailsService } from "@features/target-applications/api/applicationDetailsService";
import { targetApplicationService } from "@features/target-applications/api/targetApplicationService";
import { dedupeUserGuideStates } from "../lib/userGuideStates";
import type {
  GenerateGuideParams,
  GenerateGuideResult,
  UserGuideApplication,
  UserGuideManualSession,
  UserGuideState,
  UserGuideStateKind,
  UserGuideVersion,
} from "../model/types/user-guides.types";

interface ApiUserGuideState {
  stateHash: string;
  label: string;
  url?: string;
  path?: string;
  title?: string;
}

interface ApiUserGuideStatesResponse {
  states: ApiUserGuideState[];
}

interface ApiGenerateUserGuideResponse {
  message: string;
  userGuide: string;
  error?: string;
}

interface TargetApplicationVersion {
  id: string;
  version: string;
}

function getPathFromUrl(url?: string): string | undefined {
  if (!url) return undefined;

  try {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}${parsed.hash}` || "/";
  } catch {
    return url.startsWith("/") ? url : undefined;
  }
}

function shortenTail(value: string, maxLength = 34): string {
  if (value.length <= maxLength) return value;
  return `...${value.slice(-(maxLength - 3))}`;
}

function truncateEnd(value: string, maxLength = 38): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 3)}...`;
}

function inferStateKind(path: string): UserGuideStateKind {
  const normalized = path.toLowerCase();
  if (/(drawer|panel|modal|filter=.*open|open=true)/.test(normalized)) return "DRAWER";
  return "PAGE";
}

function mapState(state: ApiUserGuideState): UserGuideState {
  const path = state.path ?? getPathFromUrl(state.url) ?? "/";
  const label = state.label || state.title || state.url || state.stateHash.slice(0, 12);
  const copyUrl = state.url ?? path;

  return {
    stateHash: state.stateHash,
    label,
    path,
    displayLabel: truncateEnd(label),
    displayPath: shortenTail(path),
    copyUrl,
    url: state.url,
    title: state.title,
    kind: inferStateKind(path),
  };
}

function splitGuideLines(userGuide: string): string[] {
  const lines = userGuide.split(/\r?\n/).map((line) => line.trimEnd());
  return lines.some((line) => line.length > 0) ? lines : ["Guide generation completed with no content."];
}

function getTime(value: string) {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

export const userGuidesApi = {
  async getApplications(projectId: string): Promise<UserGuideApplication[]> {
    const applications = await targetApplicationService.getTargetApplications(projectId);
    return applications.map((application) => ({
      id: application.id,
      name: application.name,
      baseUrl: application.baseUrl,
      versions: ((application.versions ?? []) as TargetApplicationVersion[]).map((version) => ({
        id: version.id,
        name: version.version,
      })),
    }));
  },

  async getVersions(projectId: string, applicationId: string): Promise<UserGuideVersion[]> {
    const application = await targetApplicationService.getTargetApplication(projectId, applicationId);
    return (application.versions as TargetApplicationVersion[]).map((version) => ({
      id: version.id,
      name: version.version,
    }));
  },

  async getStates(
    projectId: string,
    applicationId: string,
    sourceId: string,
  ): Promise<UserGuideState[]> {
    const response = await apiClient.get<ApiUserGuideStatesResponse>(
      `projects/${projectId}/target-applications/${applicationId}/versions/${sourceId}/user-guide-states`,
    );

    return dedupeUserGuideStates(response.data.states.map(mapState));
  },

  async getManualSessions(
    projectId: string,
    application: UserGuideApplication,
  ): Promise<UserGuideManualSession[]> {
    const versions = application.versions ?? [];
    if (versions.length === 0) return [];

    const sessionGroups = await Promise.all(
      versions.map((version) =>
        applicationDetailsService.getCrawlSessions({
          projectId,
          applicationId: application.id,
          versionId: version.id,
          applicationName: application.name,
          applicationBaseUrl: application.baseUrl ?? "",
          versionName: version.name,
        }),
      ),
    );

    return sessionGroups
      .flat()
      .filter((session) => session.trigger === "manual")
      .sort((left, right) => getTime(left.startedAt) - getTime(right.startedAt))
      .map((session) => ({
        id: session.id,
        versionId: session.versionId,
        versionName: session.versionName,
        createdAt: session.startedAt,
        status: session.status,
      }));
  },

  async generateGuide(params: GenerateGuideParams): Promise<GenerateGuideResult> {
    const sourceId = params.mode === "manual" ? params.sessionId : params.versionId;
    if (!sourceId) throw new Error("A version or manual session must be selected.");

    const response = await apiClient.post<ApiGenerateUserGuideResponse>(
      `projects/${params.projectId}/target-applications/${params.applicationId}/versions/${sourceId}/generate-user-guide`,
      {
        startStateHash: params.startStateHash,
        endStateHash: params.endStateHash,
      },
      { timeout: 45_000 },
    );

    return {
      lines: splitGuideLines(response.data.userGuide),
    };
  },
};
