// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

export { integrationService } from "./api/integrationService";
export type {
  IntegrationProvider,
  IntegrationStatusWithReporting,
  JiraIssueProject,
  JiraIssueType,
  UpdateIntegrationReportingConfigPayload,
} from "./model/types/integration.types";
export { useIntegrationReportingOptions, useIntegrationStatus } from "./model/queries/useIntegrations";
export {
  useDisconnectIntegration,
  useStartIntegrationOAuth,
  useUpdateIntegrationReportingConfig,
} from "./model/mutations/useIntegrationMutations";
