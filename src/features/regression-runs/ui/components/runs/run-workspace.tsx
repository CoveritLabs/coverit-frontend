// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import type {
  ListRegressionEventsResponse,
  RegressionArtifact,
  RegressionArtifactTreeNode,
} from "@coveritlabs/contracts";
import { EmptyState, TabButton } from "../common/common";
import { RegressionRunArtifactsTab } from "./run-artifacts-tab";
import { RegressionRunSummary } from "./run-summary";
import { RegressionScenariosTab } from "../scenarios/scenarios-tab";
import type {
  RegressionRunListItem,
  RegressionRunTab,
  RegressionScenarioTab,
  RegressionScenarioWithReports,
} from "../../../model/types/regression-runs.types";
import styles from "../../RegressionRuns.module.scss";

export function RegressionRunWorkspace({
  run,
  runTab,
  onRunTabChange,
  scenarios,
  selectedScenario,
  selectedScenarioId,
  onSelectScenario,
  scenarioTab,
  onScenarioTabChange,
  scenarioEvents,
  scenarioArtifacts,
  scenarioArtifactsLoading,
  scenarioArtifactsError,
  onRetryScenarioArtifacts,
  scenarioArtifactTree,
  runArtifacts,
  runArtifactTree,
  projectId,
  applicationId,
  jiraReportingEnabled,
}: {
  run: RegressionRunListItem | null;
  runTab: RegressionRunTab;
  onRunTabChange: (tab: RegressionRunTab) => void;
  scenarios: RegressionScenarioWithReports[];
  selectedScenario: RegressionScenarioWithReports | null;
  selectedScenarioId: string | null;
  onSelectScenario: (scenarioId: string) => void;
  scenarioTab: RegressionScenarioTab;
  onScenarioTabChange: (tab: RegressionScenarioTab) => void;
  scenarioEvents: ListRegressionEventsResponse["events"];
  scenarioArtifacts: RegressionArtifact[];
  scenarioArtifactsLoading: boolean;
  scenarioArtifactsError: boolean;
  onRetryScenarioArtifacts: () => void;
  scenarioArtifactTree: RegressionArtifactTreeNode[];
  runArtifacts: RegressionArtifact[];
  runArtifactTree: RegressionArtifactTreeNode[];
  projectId: string;
  applicationId: string;
  jiraReportingEnabled: boolean;
}) {
  if (!run) {
    return (
      <EmptyState
        title="Select a run"
        description="Pick a run from the list to inspect scenarios, events, and collected artifacts."
      />
    );
  }

  return (
    <div className={styles.workspaceColumn}>
      <RegressionRunSummary run={run} />

      <div className={styles.tabBar}>
        <TabButton active={runTab === "scenarios"} onClick={() => onRunTabChange("scenarios")}>
          Scenarios
        </TabButton>
        <TabButton active={runTab === "artifacts"} onClick={() => onRunTabChange("artifacts")}>
          Run Artifacts
        </TabButton>
      </div>

      {runTab === "scenarios" ? (
        <RegressionScenariosTab
          scenarios={scenarios}
          selectedScenario={selectedScenario}
          selectedScenarioId={selectedScenarioId}
          scenarioTab={scenarioTab}
          onSelectScenario={onSelectScenario}
          onScenarioTabChange={onScenarioTabChange}
          scenarioEvents={scenarioEvents}
          scenarioArtifacts={scenarioArtifacts}
          scenarioArtifactsLoading={scenarioArtifactsLoading}
          scenarioArtifactsError={scenarioArtifactsError}
          onRetryScenarioArtifacts={onRetryScenarioArtifacts}
          scenarioArtifactTree={scenarioArtifactTree}
          projectId={projectId}
          applicationId={applicationId}
          runId={run.runId}
          jiraReportingEnabled={jiraReportingEnabled}
        />
      ) : runTab === "artifacts" ? (
        <RegressionRunArtifactsTab
          artifacts={runArtifacts}
          artifactTree={runArtifactTree}
          projectId={projectId}
          applicationId={applicationId}
          runId={run.runId}
        />
      ) : null}
    </div>
  );
}
