// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { apiClient } from "@services/api/client";
import type {
  ApplicationVersionCrawlSessionsResponse,
  CreateCrawlSessionRequest,
  CrawlSessionData,
} from "@coveritlabs/contracts";
import { Payload } from "@/types/common";

export const projectService = {
  async getSessions(
    projectId: string,
    applicationVersionId: string,
    versionId: string,
  ): Promise<ApplicationVersionCrawlSessionsResponse> {
    const res = await apiClient.get<ApplicationVersionCrawlSessionsResponse>(
      `projects/${projectId}/target-applications/${applicationVersionId}/versions/${versionId}/crawl-sessions/`,
    );
    return res.data;
  },

  async createSession(
    projectId: string,
    applicationVersionId: string,
    versionId: string,
    data: Payload<CreateCrawlSessionRequest>,
  ): Promise<CrawlSessionData> {
    const res = await apiClient.post<CrawlSessionData>(
      `projects/${projectId}/target-applications/${applicationVersionId}/versions/${versionId}/crawl-sessions/`,
      data,
    );
    return res.data;
  },
};
