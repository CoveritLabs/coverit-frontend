// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { apiClient } from "@shared/api/client";
import { targetApplicationService } from "@features/target-applications/api/targetApplicationService";
import type {
  GenerateGuideParams,
  GenerateGuideResult,
  UserGuideApplication,
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

export const userGuidesApi = {
  async getApplications(projectId: string): Promise<UserGuideApplication[]> {
    const applications = await targetApplicationService.getTargetApplications(projectId);
    return applications.map((application) => ({
      id: application.id,
      name: application.name,
    }));
  },

  async getVersions(projectId: string, applicationId: string): Promise<UserGuideVersion[]> {
    const application = await targetApplicationService.getTargetApplication(projectId, applicationId);
    return (application.versions as TargetApplicationVersion[]).map((version) => ({
      id: version.id,
      name: version.version,
    }));
  },

  async getStates(projectId: string, applicationId: string, versionId: string): Promise<UserGuideState[]> {
    const response = await apiClient.get<ApiUserGuideStatesResponse>(
      `projects/${projectId}/target-applications/${applicationId}/versions/${versionId}/user-guide-states`,
    );

    return response.data.states.map(mapState);
  },

  async generateGuide(params: GenerateGuideParams): Promise<GenerateGuideResult> {
    const response = await apiClient.post<ApiGenerateUserGuideResponse>(
      `projects/${params.projectId}/target-applications/${params.applicationId}/versions/${params.versionId}/generate-user-guide`,
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
