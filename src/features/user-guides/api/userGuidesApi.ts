// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { apiClient } from "@shared/api/client";
import { targetApplicationService } from "@features/target-applications/api/targetApplicationService";
import type {
  GenerateGuideParams,
  GenerateGuideResult,
  RawUserGuideSession,
  UserGuideApplication,
  UserGuideState,
  UserGuideStateKind,
  UserGuideVersion,
} from "../model/types/user-guides.types";

type ApiTrigger = number | string;

interface ApiCrawlSession {
  id: string;
  createdAt: string;
  triggerType?: ApiTrigger;
}

interface ApiCrawlSessionListResponse {
  sessions: ApiCrawlSession[];
}

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

function normalizeTrigger(trigger?: ApiTrigger): string | undefined {
  if (trigger === undefined || trigger === null) return undefined;
  return typeof trigger === "number" ? String(trigger) : trigger.toUpperCase();
}

function getSessionLabel(trigger?: ApiTrigger): string | undefined {
  const value = normalizeTrigger(trigger);
  if (!value || value === "0" || value === "UNSPECIFIED") return undefined;
  if (value === "1" || value === "MANUAL") return "Manual crawl";
  if (value === "2" || value === "SCHEDULED") return "Scheduled crawl";
  if (value === "5" || value === "ON_DEMAND") return "On-demand crawl";
  return undefined;
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

function inferStateKind(path: string): UserGuideStateKind {
  const normalized = path.toLowerCase();
  if (/(drawer|panel|modal|filter=.*open|open=true)/.test(normalized)) return "DRAWER";
  return "PAGE";
}

function mapState(state: ApiUserGuideState): UserGuideState {
  const path = state.path ?? getPathFromUrl(state.url) ?? "/";

  return {
    stateHash: state.stateHash,
    label: state.label || state.title || state.url || state.stateHash.slice(0, 12),
    path,
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
    return application.versions.map((version) => ({
      id: version.id,
      name: version.version,
    }));
  },

  async getSessions(projectId: string, applicationId: string, versionId: string): Promise<RawUserGuideSession[]> {
    const response = await apiClient.get<ApiCrawlSessionListResponse>(
      `projects/${projectId}/target-applications/${applicationId}/versions/${versionId}/crawl-sessions`,
      { params: { page: 1, pageSize: 100 } },
    );

    return response.data.sessions.map((session) => ({
      id: session.id,
      createdAt: session.createdAt,
      label: getSessionLabel(session.triggerType),
    }));
  },

  async getStates(
    projectId: string,
    applicationId: string,
    versionId: string,
    sessionId: string,
  ): Promise<UserGuideState[]> {
    const response = await apiClient.get<ApiUserGuideStatesResponse>(
      `projects/${projectId}/target-applications/${applicationId}/versions/${versionId}/crawl-sessions/${sessionId}/states`,
    );

    return response.data.states.map(mapState);
  },

  async generateGuide(params: GenerateGuideParams): Promise<GenerateGuideResult> {
    const response = await apiClient.post<ApiGenerateUserGuideResponse>(
      `projects/${params.projectId}/target-applications/${params.applicationId}/versions/${params.versionId}/crawl-sessions/${params.sessionId}/generate`,
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
