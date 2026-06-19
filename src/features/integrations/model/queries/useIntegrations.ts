// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@shared/config/queryKeys";
import { integrationService } from "../../api/integrationService";
import type { IntegrationProvider } from "../types/integration.types";
import type { IntegrationStatusResponse } from "@coveritlabs/contracts";

export function useIntegrationStatus(projectId: string | null, provider: IntegrationProvider) {
  const queryClient = useQueryClient();
  const safeProjectId = projectId ?? "__missing__";

  return useQuery({
    queryKey: queryKeys.integrations.status(safeProjectId, provider),
    queryFn: () => integrationService.getIntegrationStatus(safeProjectId, provider),
    enabled: Boolean(projectId),
    placeholderData: () =>
      projectId
        ? queryClient.getQueryData<IntegrationStatusResponse>(queryKeys.integrations.status(projectId, provider))
        : undefined,
  });
}
