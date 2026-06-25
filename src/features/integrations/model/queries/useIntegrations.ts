// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@shared/config/queryKeys";
import { integrationService } from "../../api/integrationService";
import type { IntegrationProvider } from "../types/integration.types";
import type { IntegrationReportingOptionsResponse, IntegrationStatusWithReporting } from "../types/integration.types";

export function useIntegrationStatus(projectId: string | null, provider: IntegrationProvider) {
  const queryClient = useQueryClient();
  const safeProjectId = projectId ?? "__missing__";

  return useQuery({
    queryKey: queryKeys.integrations.status(safeProjectId, provider),
    queryFn: () => integrationService.getIntegrationStatus(safeProjectId, provider),
    enabled: Boolean(projectId),
    placeholderData: () =>
      projectId
        ? queryClient.getQueryData<IntegrationStatusWithReporting>(queryKeys.integrations.status(projectId, provider))
        : undefined,
  });
}

export function useIntegrationReportingOptions(
  projectId: string | null,
  provider: IntegrationProvider,
  enabled = true,
) {
  const queryClient = useQueryClient();
  const safeProjectId = projectId ?? "__missing__";

  return useQuery({
    queryKey: queryKeys.integrations.reportingOptions(safeProjectId, provider),
    queryFn: () => integrationService.getReportingOptions(safeProjectId, provider),
    enabled: Boolean(projectId) && enabled,
    placeholderData: () =>
      projectId
        ? queryClient.getQueryData<IntegrationReportingOptionsResponse>(
            queryKeys.integrations.reportingOptions(projectId, provider),
          )
        : undefined,
  });
}
