// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { useEffect, useMemo, useState, type ComponentType } from "react";
import { ExternalLink, Mail, ShieldCheck, Unlink } from "lucide-react";
import { JiraIcon } from "@shared/icons";
import { Badge, Button, Card, Select } from "@shared/ui";
import { cn } from "@shared/utils/cn";
import {
  useDisconnectIntegration,
  useIntegrationReportingOptions,
  useIntegrationStatus,
  useStartIntegrationOAuth,
  useUpdateIntegrationReportingConfig,
  type IntegrationProvider,
  type JiraIssueProject,
  type JiraIssueType,
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

interface AdministrationIntegrationsProps {
  projectId: string;
  canManage: boolean;
}

export function AdministrationIntegrations({ projectId, canManage }: AdministrationIntegrationsProps) {
  const jiraStatus = useIntegrationStatus(projectId, "jira");
  const jiraOptions = useIntegrationReportingOptions(projectId, "jira", Boolean(jiraStatus.data?.connected));
  const startOAuth = useStartIntegrationOAuth();
  const disconnectIntegration = useDisconnectIntegration();
  const updateReportingConfig = useUpdateIntegrationReportingConfig();
  const [jiraProjectId, setJiraProjectId] = useState<string | null>(null);
  const [jiraIssueTypeId, setJiraIssueTypeId] = useState<string | null>(null);

  const jiraProjects: JiraIssueProject[] =
    jiraOptions.data?.options.case === "jira" ? jiraOptions.data.options.value.projects : [];
  const jiraIssueTypes: JiraIssueType[] =
    jiraOptions.data?.options.case === "jira" ? (jiraOptions.data.options.value.issueTypes as JiraIssueType[]) : [];
  const jiraReportingConfig =
    jiraStatus.data?.reportingConfig?.case === "jiraReportingConfig"
      ? jiraStatus.data.reportingConfig.value
      : undefined;

  useEffect(() => {
    if (jiraReportingConfig?.project?.id) setJiraProjectId(jiraReportingConfig.project.id);
    if (jiraReportingConfig?.issueType?.id) setJiraIssueTypeId(jiraReportingConfig.issueType.id);
  }, [jiraReportingConfig?.issueType?.id, jiraReportingConfig?.project?.id]);

  const jiraProjectOptions = useMemo(
    () => jiraProjects.map((project) => ({ value: project.id, label: `${project.key} - ${project.name}` })),
    [jiraProjects],
  );
  const selectedJiraIssueTypes = useMemo(
    () => jiraIssueTypes.filter((issueType) => issueType.projectId === jiraProjectId),
    [jiraIssueTypes, jiraProjectId],
  );
  const jiraIssueTypeOptions = useMemo(
    () => selectedJiraIssueTypes.map((issueType) => ({ value: issueType.id, label: issueType.name })),
    [selectedJiraIssueTypes],
  );

  useEffect(() => {
    if (!jiraIssueTypeId || jiraOptions.isLoading || jiraOptions.data?.options.case !== "jira") return;
    if (!selectedJiraIssueTypes.some((issueType) => issueType.id === jiraIssueTypeId)) {
      setJiraIssueTypeId(null);
    }
  }, [jiraIssueTypeId, jiraOptions.data?.options.case, jiraOptions.isLoading, selectedJiraIssueTypes]);

  const handleConnect = (provider: IntegrationProvider) => {
    startOAuth.mutate({ projectId, provider });
  };

  const handleDisconnect = (provider: IntegrationProvider) => {
    disconnectIntegration.mutate({ projectId, provider });
  };

  const handleSaveJiraReporting = () => {
    const selectedProject = jiraProjects.find((project) => project.id === jiraProjectId);
    const selectedIssueType = selectedJiraIssueTypes.find((issueType) => issueType.id === jiraIssueTypeId);
    if (!selectedProject || !selectedIssueType) return;

    updateReportingConfig.mutate({
      projectId,
      provider: "jira",
      payload: {
        config: {
          case: "jira",
          value: {
            enabled: true,
            project: selectedProject,
            issueType: selectedIssueType,
          },
        },
      },
    });
  };

  return (
    <div className={styles.tableSection}>
      <div className={styles.integrationsList}>
        {INTEGRATIONS.map((integration) => {
          const IntegrationIcon = integration.Icon;
          const status = integration.provider === "jira" ? jiraStatus.data : undefined;
          const isConnected = Boolean(status?.connected);
          const connectedBy = status?.authorizedByUser;
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
                            {status.scopes.map((scope: string) => (
                              <Badge key={scope} variant="outline" className={styles.integrationScopeBadge}>
                                {scope}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {integration.provider === "jira" && (
                          <div className={styles.reportingConfigPanel}>
                            <div>
                              <p className={styles.integrationMetaLabel}>Scenario reporting</p>
                              <p className={styles.integrationMeta}>
                                {jiraReportingConfig?.enabled
                                  ? `Issues will be created in ${jiraReportingConfig.project?.key ?? "Jira"}.`
                                  : "Choose a Jira destination for failed and warning scenario reports."}
                              </p>
                            </div>
                            {canManage && (
                              <div className={styles.reportingConfigControls}>
                                <Select
                                  options={jiraProjectOptions}
                                  value={jiraProjectId}
                                  placeholder={jiraOptions.isLoading ? "Loading projects..." : "Jira project"}
                                  onChange={(value) => {
                                    setJiraProjectId(value);
                                    setJiraIssueTypeId(null);
                                  }}
                                  disabled={jiraOptions.isLoading || jiraOptions.isError}
                                />
                                <Select
                                  options={jiraIssueTypeOptions}
                                  value={jiraIssueTypeId}
                                  placeholder={
                                    jiraOptions.isLoading
                                      ? "Loading issue types..."
                                      : jiraProjectId
                                        ? "Issue type"
                                        : "Select a Jira project first"
                                  }
                                  onChange={setJiraIssueTypeId}
                                  disabled={jiraOptions.isLoading || jiraOptions.isError || !jiraProjectId}
                                />
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={handleSaveJiraReporting}
                                  disabled={!jiraProjectId || !jiraIssueTypeId || updateReportingConfig.isPending}
                                >
                                  <ShieldCheck className={styles.iconSmall} />
                                  {updateReportingConfig.isPending ? "Saving..." : "Save"}
                                </Button>
                              </div>
                            )}
                            {jiraOptions.isError && (
                              <p className={styles.projectError}>Failed to load Jira reporting options.</p>
                            )}
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
