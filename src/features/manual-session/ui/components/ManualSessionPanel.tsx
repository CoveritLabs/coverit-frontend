// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import {
  AlertCircle,
  Bug,
  CheckCircle2,
  CircleStop,
  CornerDownRight,
  ListChecks,
  LoaderCircle,
  Play,
  Power,
  RotateCcw,
} from "lucide-react";
import type {
  ActionFeedback,
  ApplicationVersionView,
  ApplicationView,
  ManualAction,
  RecordedStep,
  VisibleStepItem,
} from "../../model/types/manual-session.types";
import styles from "../ManualSession.module.scss";

type ManualSessionTab = "record" | "bug";

type ManualSessionPanelProps = {
  appName: string;
  versionName: string;
  applications: ApplicationView[];
  selectedApplicationId: string | null;
  versions: ApplicationVersionView[];
  selectedVersionId: string | null;
  hasLiveSession: boolean;
  status: string;
  isConnecting: boolean;
  hasPendingAction: boolean;
  pendingAction: ManualAction | null;
  canConnect: boolean;
  currentUrl: string;
  currentTitle: string;
  activeTab: ManualSessionTab;
  actionFeedback: ActionFeedback | null;
  canSend: boolean;
  flowStarted: boolean;
  canFinishFlow: boolean;
  pendingEventBlockerMessage: string | null;
  flowMarker: string | null;
  lastFlowMessage: string | null;
  visibleSteps: VisibleStepItem[];
  jiraReportingEnabled: boolean;
  jiraReportingMessage: string;
  bugSummary: string;
  bugSeverity: string;
  canReportBug: boolean;
  onApplicationChange: (applicationId: string | null) => void;
  onVersionChange: (versionId: string | null) => void;
  onConnectionAction: () => void;
  onTabChange: (tab: ManualSessionTab) => void;
  onRewindToCheckpoint: () => void;
  onStartFlow: () => void;
  onFinishFlow: () => void;
  onContinueFromStep: (step: RecordedStep) => void;
  onBugSummaryChange: (summary: string) => void;
  onBugSeverityChange: (severity: string) => void;
  onReportBug: () => void;
  onBack: () => void;
};

export function ManualSessionPanel({
  appName,
  versionName,
  applications,
  selectedApplicationId,
  versions,
  selectedVersionId,
  hasLiveSession,
  status,
  isConnecting,
  hasPendingAction,
  pendingAction,
  canConnect,
  currentUrl,
  currentTitle,
  activeTab,
  actionFeedback,
  canSend,
  flowStarted,
  canFinishFlow,
  pendingEventBlockerMessage,
  flowMarker,
  lastFlowMessage,
  visibleSteps,
  jiraReportingEnabled,
  jiraReportingMessage,
  bugSummary,
  bugSeverity,
  canReportBug,
  onApplicationChange,
  onVersionChange,
  onConnectionAction,
  onTabChange,
  onRewindToCheckpoint,
  onStartFlow,
  onFinishFlow,
  onContinueFromStep,
  onBugSummaryChange,
  onBugSeverityChange,
  onReportBug,
  onBack,
}: ManualSessionPanelProps) {
  return (
    <aside className={styles.panel}>
      <section className={styles.sidebarContext}>
        <div className={styles.sidebarContextHeader}>
          <span className={styles.contextEyebrow}>Session Filters</span>
          <strong>Recording Target</strong>
          <span className={styles.targetSummary}>
            {appName} / {versionName}
          </span>
        </div>

        <label className={styles.selectGroup}>
          <span className={styles.selectLabel}>Application</span>
          <select
            value={selectedApplicationId ?? ""}
            disabled={hasLiveSession || applications.length === 0}
            onChange={(event) => onApplicationChange(event.target.value || null)}
          >
            {applications.length === 0 && <option value="">No applications</option>}
            {applications.map((application) => (
              <option key={application.id} value={application.id}>
                {application.name}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.selectGroup}>
          <span className={styles.selectLabel}>Version</span>
          <select
            value={selectedVersionId ?? ""}
            disabled={hasLiveSession || versions.length === 0}
            onChange={(event) => onVersionChange(event.target.value || null)}
          >
            {versions.length === 0 && <option value="">No versions</option>}
            {versions.map((version) => (
              <option key={version.id} value={version.id}>
                {version.version}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className={hasLiveSession && status !== "closed" ? styles.dangerButton : styles.connectButton}
          onClick={onConnectionAction}
          disabled={(!hasLiveSession && !canConnect) || isConnecting || hasPendingAction}
        >
          {isConnecting || pendingAction === "disconnect" ? (
            <LoaderCircle className={styles.spinnerIcon} />
          ) : hasLiveSession && status !== "closed" ? (
            <Power className={styles.buttonIcon} />
          ) : (
            <Play className={styles.buttonIcon} />
          )}
          {hasLiveSession && status !== "closed"
            ? pendingAction === "disconnect"
              ? "Disconnecting..."
              : "Disconnect"
            : isConnecting
              ? "Connecting..."
              : "Connect"}
        </button>

        <div className={styles.currentPage}>
          <span className={styles.selectLabel}>Current Page</span>
          <span title={currentUrl}>{currentTitle || currentUrl || "Waiting for browser..."}</span>
        </div>
      </section>

      <div className={styles.tabBar}>
        <button
          type="button"
          className={activeTab === "record" ? styles.tabButtonActive : styles.tabButton}
          onClick={() => onTabChange("record")}
        >
          <ListChecks className={styles.tabIcon} />
          Record
        </button>
        <button
          type="button"
          className={activeTab === "bug" ? styles.tabButtonActive : styles.tabButton}
          onClick={() => onTabChange("bug")}
        >
          <Bug className={styles.tabIcon} />
          Report Bug
        </button>
      </div>

      {actionFeedback && (
        <div
          className={
            actionFeedback.kind === "error"
              ? styles.actionFeedbackError
              : actionFeedback.kind === "success"
                ? styles.actionFeedbackSuccess
                : styles.actionFeedbackPending
          }
        >
          {actionFeedback.kind === "pending" ? (
            <LoaderCircle className={styles.spinnerIcon} />
          ) : actionFeedback.kind === "error" ? (
            <AlertCircle className={styles.feedbackIcon} />
          ) : (
            <CheckCircle2 className={styles.feedbackIcon} />
          )}
          <span>{actionFeedback.message}</span>
        </div>
      )}

      {activeTab === "record" ? (
        <div className={styles.tabContent}>
          <div className={styles.controls}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={onRewindToCheckpoint}
              disabled={!canSend || !flowStarted || hasPendingAction}
            >
              {pendingAction === "reset" ? (
                <LoaderCircle className={styles.spinnerIcon} />
              ) : (
                <RotateCcw className={styles.buttonIcon} />
              )}
              {pendingAction === "reset" ? "Resetting..." : "Reset"}
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={onStartFlow}
              disabled={!canSend || flowStarted || hasPendingAction}
            >
              {pendingAction === "start" ? (
                <LoaderCircle className={styles.spinnerIcon} />
              ) : (
                <Play className={styles.buttonIcon} />
              )}
              {pendingAction === "start" ? "Starting..." : flowStarted ? "Started" : "Start"}
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={onFinishFlow}
              disabled={!canFinishFlow || hasPendingAction}
            >
              {pendingAction === "finish" ? (
                <LoaderCircle className={styles.spinnerIcon} />
              ) : (
                <CheckCircle2 className={styles.buttonIcon} />
              )}
              {pendingAction === "finish" ? "Finishing..." : "Finish"}
            </button>
          </div>

          {pendingEventBlockerMessage && (
            <div className={styles.integrationNotice}>
              <AlertCircle className={styles.feedbackIcon} />
              <span>{pendingEventBlockerMessage}</span>
            </div>
          )}

          <div className={styles.stepsHeader}>
            <span>Recorded Steps</span>
            <span className={styles.stepCount}>{visibleSteps.length}</span>
          </div>

          {flowMarker && (
            <div className={styles.flowMarker}>
              <CircleStop className={styles.markerIcon} />
              <span>{new Date(flowMarker).toLocaleTimeString()}</span>
            </div>
          )}

          {lastFlowMessage && (
            <div className={styles.flowMarker}>
              <CheckCircle2 className={styles.markerIcon} />
              <span>{lastFlowMessage}</span>
            </div>
          )}

          <ol className={styles.stepList}>
            {visibleSteps.map((item) => (
              <li
                key={item.key}
                className={item.pending ? styles.stepPending : item.finalizedEvent ? styles.stepEvent : styles.step}
              >
                <span className={styles.stepIndex}>{item.index}</span>
                <span className={styles.stepBody}>
                  <strong>{item.label}</strong>
                  <span>
                    {item.detail}
                    {item.pending ? " / pending" : ""}
                  </span>
                </span>
                {item.canContinue && item.step ? (
                  <button
                    type="button"
                    className={styles.stepActionButton}
                    onClick={() => onContinueFromStep(item.step as RecordedStep)}
                    disabled={!canSend || !flowStarted || hasPendingAction}
                  >
                    {pendingAction === "continue" ? (
                      <LoaderCircle className={styles.spinnerIcon} />
                    ) : (
                      <CornerDownRight className={styles.stepActionIcon} />
                    )}
                    {pendingAction === "continue" ? "Continuing..." : "Continue"}
                  </button>
                ) : (
                  <span className={item.pending ? styles.pendingBadge : styles.recordedBadge}>
                    {item.pending ? "Pending" : "Recorded"}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <form className={styles.tabContent} onSubmit={(event) => event.preventDefault()}>
          {!jiraReportingEnabled && (
            <div className={styles.integrationNotice}>
              <AlertCircle className={styles.feedbackIcon} />
              <span>{jiraReportingMessage}</span>
            </div>
          )}

          {pendingEventBlockerMessage && (
            <div className={styles.integrationNotice}>
              <AlertCircle className={styles.feedbackIcon} />
              <span>{pendingEventBlockerMessage}</span>
            </div>
          )}

          <label className={styles.field}>
            <span>Summary</span>
            <textarea value={bugSummary} onChange={(event) => onBugSummaryChange(event.target.value)} rows={5} />
          </label>

          <label className={styles.field}>
            <span>Severity</span>
            <select value={bugSeverity} onChange={(event) => onBugSeverityChange(event.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </label>

          <button type="button" className={styles.reportButton} disabled={!canReportBug} onClick={onReportBug}>
            {pendingAction === "bug" && <LoaderCircle className={styles.spinnerIcon} />}
            {pendingAction === "bug" ? "Queueing..." : "Queue Bug Flow"}
          </button>
        </form>
      )}

      <button type="button" className={styles.backButton} onClick={onBack}>
        Back to Applications
      </button>
    </aside>
  );
}
