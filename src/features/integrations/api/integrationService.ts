// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { apiClient } from "@shared/api/client";
import type { IntegrationStatusResponse, MessageResponse, StartIntegrationOAuthResponse } from "@coveritlabs/contracts";
import type { IntegrationProvider } from "../model/types/integration.types";

export const integrationService = {
  async getIntegrationStatus(projectId: string, provider: IntegrationProvider): Promise<IntegrationStatusResponse> {
    const res = await apiClient.get<IntegrationStatusResponse>(`projects/${projectId}/integrations/${provider}`);
    return res.data;
  },

  async startIntegrationOAuth(
    projectId: string,
    provider: IntegrationProvider,
  ): Promise<StartIntegrationOAuthResponse> {
    const res = await apiClient.post<StartIntegrationOAuthResponse>(
      `projects/${projectId}/integrations/${provider}/oauth`,
    );
    return res.data;
  },

  async disconnectIntegration(projectId: string, provider: IntegrationProvider): Promise<MessageResponse> {
    const res = await apiClient.delete<MessageResponse>(`projects/${projectId}/integrations/${provider}`);
    return res.data;
  },
};
