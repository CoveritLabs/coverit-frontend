// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import type {
  IntegrationReportingConfigResponse as ContractIntegrationReportingConfigResponse,
  IntegrationReportingOptionsResponse as ContractIntegrationReportingOptionsResponse,
  IntegrationStatusResponse as ContractIntegrationStatusResponse,
  JiraReportingConfig as ContractJiraReportingConfig,
  UpdateIntegrationReportingConfigRequest as ContractUpdateIntegrationReportingConfigRequest,
} from "@coveritlabs/contracts";
import type { Payload } from "@shared/types/common";

export type IntegrationProvider = Payload<ContractIntegrationStatusResponse>["provider"];

export type JiraReportingConfig = Payload<ContractJiraReportingConfig>;
export type JiraIssueProject = NonNullable<JiraReportingConfig["project"]>;
export type JiraIssueType = NonNullable<JiraReportingConfig["issueType"]>;

export type IntegrationReportingConfig = Payload<ContractIntegrationReportingConfigResponse>["config"];
export type IntegrationReportingOptions = Payload<ContractIntegrationReportingOptionsResponse>["options"];

export type IntegrationStatusWithReporting = Payload<ContractIntegrationStatusResponse>;
export type IntegrationReportingOptionsResponse = Payload<ContractIntegrationReportingOptionsResponse>;
export type IntegrationReportingConfigResponse = Payload<ContractIntegrationReportingConfigResponse>;
export type UpdateIntegrationReportingConfigPayload = Payload<ContractUpdateIntegrationReportingConfigRequest>;
