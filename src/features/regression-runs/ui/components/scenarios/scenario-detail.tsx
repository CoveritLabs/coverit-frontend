// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Send, X } from "lucide-react";
import type { RegressionArtifact } from "@coveritlabs/contracts";
import { Badge, Button, Card, Input } from "@shared/ui";
import { ExecutionStatusBadge, ResultDistribution, TabButton } from "../common/common";
import { useCreateScenarioIntegrationReport } from "../../../model/queries/useRegressionRuns";
import type {
  RegressionScenarioTab,
  RegressionScenarioWithReports,
  ScenarioIntegrationReport,
} from "../../../model/types/regression-runs.types";
import { formatDateTime, formatDuration, formatStatus } from "../../../lib/formatters";
import styles from "../../RegressionRuns.module.scss";

export function RegressionScenarioDetail({
  scenario,
  scenarioTab,
  onScenarioTabChange,
  artifacts,
  artifactsLoading,
  artifactsError,
  onRetryArtifacts,
  projectId,
  applicationId,
  runId,
  jiraReportingEnabled,
  children,
}: {
  scenario: RegressionScenarioWithReports;
  scenarioTab: RegressionScenarioTab;
  onScenarioTabChange: (tab: RegressionScenarioTab) => void;
  artifacts: RegressionArtifact[];
  artifactsLoading: boolean;
  artifactsError: boolean;
  onRetryArtifacts: () => void;
  projectId: string;
  applicationId: string;
  runId: string;
  jiraReportingEnabled: boolean;
  children: React.ReactNode;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState(() => scenario.title ?? scenario.scenarioName ?? scenario.scenarioKey);
  const [description, setDescription] = useState(() => defaultReportDescription(scenario));
  const [selectedArtifactIds, setSelectedArtifactIds] = useState<string[]>(() =>
    artifacts.map((artifact) => artifact.id),
  );
  const [artifactSelectionInitialized, setArtifactSelectionInitialized] = useState(() => artifacts.length > 0);
  const createReport = useCreateScenarioIntegrationReport();
  const jiraReport = scenario.integrationReports?.find(
    (report: ScenarioIntegrationReport) => report.provider === "jira",
  );
  const reportable = scenario.status === "failed" || scenario.warningCount > 0;
  const reportBusy =
    jiraReport?.status === "pending" || jiraReport?.status === "creating" || jiraReport?.status === "attaching";
  const canOpenReportModal = reportable && jiraReportingEnabled && jiraReport?.status !== "created" && !reportBusy;

  const artifactLabelById = useMemo(
    () => new Map(artifacts.map((artifact) => [artifact.id, artifact.name])),
    [artifacts],
  );
  const selectedReportArtifactIds = useMemo(
    () => selectedArtifactIds.filter((artifactId) => artifactLabelById.has(artifactId)),
    [artifactLabelById, selectedArtifactIds],
  );
  const selectedArtifactCount = selectedReportArtifactIds.length;
  const reportControlsDisabled = createReport.isPending;

  useEffect(() => {
    if (!modalOpen || artifactSelectionInitialized || artifactsLoading || artifacts.length === 0) return;

    setSelectedArtifactIds(artifacts.map((artifact) => artifact.id));
    setArtifactSelectionInitialized(true);
  }, [artifactSelectionInitialized, artifacts, artifactsLoading, modalOpen]);

  const openModal = () => {
    setTitle(scenario.title ?? scenario.scenarioName ?? scenario.scenarioKey);
    setDescription(defaultReportDescription(scenario));
    setSelectedArtifactIds(artifacts.map((artifact) => artifact.id));
    setArtifactSelectionInitialized(artifacts.length > 0);
    setModalOpen(true);
  };

  const toggleArtifact = (artifactId: string) => {
    setSelectedArtifactIds((current) =>
      current.includes(artifactId) ? current.filter((id) => id !== artifactId) : [...current, artifactId],
    );
    setArtifactSelectionInitialized(true);
  };

  const selectAllArtifacts = () => {
    setSelectedArtifactIds(artifacts.map((artifact) => artifact.id));
    setArtifactSelectionInitialized(true);
  };

  const clearArtifacts = () => {
    setSelectedArtifactIds([]);
    setArtifactSelectionInitialized(true);
  };

  const submitReport = async () => {
    await createReport.mutateAsync({
      projectId,
      applicationId,
      runId,
      scenarioId: scenario.id,
      provider: "jira",
      payload: {
        title,
        description,
        artifactIds: selectedReportArtifactIds,
      },
    });
    setModalOpen(false);
  };

  return (
    <div className={styles.scenarioDetailColumn}>
      <Card className={`${styles.panel} ${styles.summaryHeaderCard} ${styles.scenarioHeaderPanel}`}>
        <div className={styles.summaryHeaderMain}>
          <div>
            <h3>{scenario.title ?? scenario.scenarioName ?? scenario.scenarioKey}</h3>
          </div>
          <div className={styles.scenarioHeaderActions}>
            {jiraReport?.status === "created" && jiraReport.externalIssueUrl ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(jiraReport.externalIssueUrl, "_blank", "noopener,noreferrer")}
              >
                <ExternalLink className={styles.iconSmall} />
                {jiraReport.externalIssueKey ?? "Jira issue"}
              </Button>
            ) : jiraReport ? (
              <Badge variant="outline" className={styles.reportStatusBadge}>
                Jira {formatReportStatus(jiraReport.status)}
              </Badge>
            ) : null}
            {canOpenReportModal && (
              <Button size="sm" variant="secondary" onClick={openModal}>
                <Send className={styles.iconSmall} />
                {jiraReport?.status === "failed" ? "Retry Jira" : "Report"}
              </Button>
            )}
            <ExecutionStatusBadge status={scenario.status} warningCount={scenario.warningCount} />
          </div>
        </div>

        <div className={styles.summaryHeaderMeta}>
          <span className={styles.summaryHeaderMetric}>
            <span>Status</span>
            <strong>{formatStatus(scenario.status)}</strong>
          </span>
          <span className={styles.summaryHeaderMetric}>
            <span>Duration</span>
            <strong>{formatDuration(scenario.durationMs)}</strong>
          </span>
          <span className={styles.summaryHeaderMetric}>
            <span>Started</span>
            <strong>{formatDateTime(scenario.startedAt)}</strong>
          </span>
          {scenario.file && (
            <span className={`${styles.summaryHeaderMetric} ${styles.summaryHeaderMetricWide}`}>
              <span>File</span>
              <strong>
                {scenario.file}
                {scenario.line ? `:${scenario.line}` : ""}
              </strong>
            </span>
          )}
          <span className={styles.summaryHeaderMetric}>
            <span>Results</span>
            <ResultDistribution
              passed={scenario.passedCount}
              warnings={scenario.warningCount}
              failed={scenario.failedCount}
              compact
            />
          </span>
        </div>
      </Card>

      <div className={styles.tabBar}>
        <TabButton active={scenarioTab === "events"} onClick={() => onScenarioTabChange("events")}>
          Events
        </TabButton>
        <TabButton active={scenarioTab === "artifacts"} onClick={() => onScenarioTabChange("artifacts")}>
          Artifacts
        </TabButton>
      </div>

      {children}

      {modalOpen && (
        <div className={styles.modalOverlay} role="presentation">
          <Card className={styles.reportModal} role="dialog" aria-modal="true" aria-label="Report scenario">
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Report scenario</h3>
              <Button size="icon" variant="ghost" onClick={() => setModalOpen(false)}>
                <X className={styles.iconSmall} />
              </Button>
            </div>

            <div className={styles.modalBody}>
              <label className={styles.modalField}>
                <span>Title</span>
                <Input value={title} onChange={(event) => setTitle(event.target.value)} />
              </label>

              <label className={styles.modalField}>
                <span>Description</span>
                <textarea
                  className={styles.reportTextarea}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </label>

              <div className={styles.modalField}>
                <span>Artifacts</span>
                <div className={styles.reportArtifactToolbar}>
                  <span>
                    {selectedArtifactCount} of {artifacts.length} selected
                  </span>
                  <div className={styles.reportArtifactActions}>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={selectAllArtifacts}
                      disabled={reportControlsDisabled || artifactsLoading || artifacts.length === 0}
                    >
                      Select all
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={clearArtifacts}
                      disabled={reportControlsDisabled || selectedArtifactCount === 0}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
                <div className={styles.reportArtifactList}>
                  {artifactsLoading ? (
                    <p className={styles.panelEmpty}>Loading artifacts...</p>
                  ) : artifactsError ? (
                    <div className={styles.reportArtifactError}>
                      <p className={styles.panelEmpty}>Failed to load artifacts.</p>
                      <Button size="sm" variant="outline" onClick={onRetryArtifacts} disabled={reportControlsDisabled}>
                        Retry
                      </Button>
                    </div>
                  ) : artifacts.length === 0 ? (
                    <p className={styles.panelEmpty}>No artifacts available.</p>
                  ) : (
                    artifacts.map((artifact) => (
                      <label key={artifact.id} className={styles.reportArtifactItem}>
                        <input
                          type="checkbox"
                          checked={selectedArtifactIds.includes(artifact.id)}
                          disabled={reportControlsDisabled}
                          onChange={() => toggleArtifact(artifact.id)}
                        />
                        <span>{artifactLabelById.get(artifact.id) ?? artifact.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className={styles.modalActions}>
              <Button variant="ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => void submitReport()}
                disabled={createReport.isPending || !title.trim() || !description.trim()}
              >
                <Send className={styles.iconSmall} />
                {createReport.isPending ? "Reporting..." : "Report"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function defaultReportDescription(scenario: RegressionScenarioWithReports): string {
  const name = scenario.title ?? scenario.scenarioName ?? scenario.scenarioKey;
  const status = scenario.status === "passed" && scenario.warningCount > 0 ? "warning" : scenario.status;
  return [
    `Scenario: ${name}`,
    `Status: ${status}`,
    `Failures: ${scenario.failedCount}`,
    `Warnings: ${scenario.warningCount}`,
  ].join("\n");
}

function formatReportStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}
