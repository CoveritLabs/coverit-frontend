// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import type { ComponentType } from "react";
import { Clock3, ExternalLink, Mail, ShieldCheck, Unlink } from "lucide-react";
import { JiraIcon } from "@shared/icons";
import { Badge, Button, Card } from "@shared/ui";
import { cn } from "@shared/utils/cn";
import {
  useDisconnectIntegration,
  useIntegrationStatus,
  useStartIntegrationOAuth,
  type IntegrationProvider,
} from "@features/integrations";
import styles from "./Administration.module.scss";

interface IntegrationDefinition {
  provider: IntegrationProvider;
  name: string;
  description: string;
  Icon: ComponentType;
}

const INTEGRATIONS: IntegrationDefinition[] = [
  {
    provider: "jira",
    name: "Jira",
    description: "Enable issue linking and automatic issue creation to Jira.",
    Icon: JiraIcon,
  },
];

function formatIntegrationDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

interface AdministrationIntegrationsProps {
  projectId: string;
  canManage: boolean;
}

export function AdministrationIntegrations({ projectId, canManage }: AdministrationIntegrationsProps) {
  const jiraStatus = useIntegrationStatus(projectId, "jira");
  const startOAuth = useStartIntegrationOAuth();
  const disconnectIntegration = useDisconnectIntegration();

  const handleConnect = (provider: IntegrationProvider) => {
    startOAuth.mutate({ projectId, provider });
  };

  const handleDisconnect = (provider: IntegrationProvider) => {
    disconnectIntegration.mutate({ projectId, provider });
  };

  return (
    <div className={styles.tableSection}>
      <div className={styles.integrationsList}>
        {INTEGRATIONS.map((integration) => {
          const IntegrationIcon = integration.Icon;
          const status = integration.provider === "jira" ? jiraStatus.data : undefined;
          const isConnected = Boolean(status?.connected);
          const connectedBy = status?.authorizedByUser;
          const refreshedAt = formatIntegrationDate(status?.refreshedAt);
          const updatedAt = formatIntegrationDate(status?.updatedAt);
          const connectedAt = formatIntegrationDate(status?.createdAt);
          const tokenExpiresAt = formatIntegrationDate(status?.accessTokenExpiresAt);
          const isLoading = integration.provider === "jira" && jiraStatus.isLoading;
          const isPending =
            (startOAuth.isPending && startOAuth.variables?.provider === integration.provider) ||
            (disconnectIntegration.isPending && disconnectIntegration.variables?.provider === integration.provider);

          return (
            <Card key={integration.provider} className={styles.integrationCard}>
              <div className={styles.integrationRow}>
                <div className={styles.integrationInfo}>
                  <div className={styles.integrationLogo}>
                    <IntegrationIcon />
                  </div>
                  <div className={styles.integrationContent}>
                    <div className={styles.integrationNameRow}>
                      <p className={styles.integrationName}>{integration.name}</p>
                      <Badge
                        variant="outline"
                        className={cn(
                          styles.roleBadge,
                          isConnected ? styles.integrationStatusConnected : styles.integrationStatusDisconnected,
                        )}
                      >
                        {isLoading ? "Checking..." : isConnected ? "Connected" : "Not connected"}
                      </Badge>
                    </div>
                    <p className={styles.integrationDescription}>{integration.description}</p>

                    {isConnected ? (
                      <div className={styles.integrationDetails}>
                        {connectedBy && (
                          <div className={styles.integrationUserCard}>
                            <div>
                              <p className={styles.integrationMetaLabel}>Connected by</p>
                              <p className={styles.integrationUserName}>{connectedBy.name || "Unknown user"}</p>
                              <div className={styles.integrationUserEmail}>
                                <Mail className={styles.iconTinyMuted} />
                                <span>{connectedBy.email || "No email"}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {status?.scopes && status.scopes.length > 0 && (
                          <div className={styles.integrationScopes}>
                            {status.scopes.map((scope) => (
                              <Badge key={scope} variant="outline" className={styles.integrationScopeBadge}>
                                {scope}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className={styles.integrationMeta}>
                        Connect Jira to make issue linking available for this project.
                      </p>
                    )}
                  </div>
                </div>

                {canManage && (
                  <div className={styles.integrationActions}>
                    {isConnected ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className={cn(styles.integrationTextButton, styles.dangerButton)}
                        onClick={() => handleDisconnect(integration.provider)}
                        disabled={isPending}
                      >
                        <Unlink className={styles.iconSmall} />
                        Disconnect
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleConnect(integration.provider)}
                        disabled={isPending || isLoading}
                      >
                        <ExternalLink className={styles.iconSmall} />
                        {isPending ? "Connecting..." : "Connect"}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </Card>
          );
        })}

        {!canManage && <p className={styles.projectMeta}>Only project admins can manage integrations.</p>}
      </div>
    </div>
  );
}
