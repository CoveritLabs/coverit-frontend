// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@shared/config/queryKeys";
import { toast } from "@shared/ui";
import { integrationService } from "../../api/integrationService";
import type {
  IntegrationProvider,
  IntegrationReportingConfigResponse,
  UpdateIntegrationReportingConfigPayload,
} from "../types/integration.types";
import type { MessageResponse, StartIntegrationOAuthResponse } from "@coveritlabs/contracts";

export function useStartIntegrationOAuth() {
  return useMutation<StartIntegrationOAuthResponse, Error, { projectId: string; provider: IntegrationProvider }>({
    mutationFn: ({ projectId, provider }) => integrationService.startIntegrationOAuth(projectId, provider),
    onSuccess: (data) => {
      window.location.href = data.authorizationUrl;
    },
    onError: (error) => {
      toast.error("Failed to start integration authorization", error.message);
    },
  });
}

export function useDisconnectIntegration() {
  const queryClient = useQueryClient();

  return useMutation<MessageResponse, Error, { projectId: string; provider: IntegrationProvider }>({
    mutationFn: ({ projectId, provider }) => integrationService.disconnectIntegration(projectId, provider),
    onSuccess: (_data, variables) => {
      toast.success("Integration disconnected");
      queryClient.invalidateQueries({
        queryKey: queryKeys.integrations.status(variables.projectId, variables.provider),
      });
    },
    onError: (error) => {
      toast.error("Failed to disconnect integration", error.message);
    },
  });
}

export function useUpdateIntegrationReportingConfig() {
  const queryClient = useQueryClient();

  return useMutation<
    IntegrationReportingConfigResponse,
    Error,
    { projectId: string; provider: IntegrationProvider; payload: UpdateIntegrationReportingConfigPayload }
  >({
    mutationFn: ({ projectId, provider, payload }) =>
      integrationService.updateReportingConfig(projectId, provider, payload),
    onSuccess: (_data, variables) => {
      toast.success("Reporting configuration saved");
      queryClient.invalidateQueries({
        queryKey: queryKeys.integrations.status(variables.projectId, variables.provider),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.integrations.reportingOptions(variables.projectId, variables.provider),
      });
    },
    onError: (error) => {
      toast.error("Failed to save reporting configuration", error.message);
    },
  });
}
