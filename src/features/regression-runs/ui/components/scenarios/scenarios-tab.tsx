// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import type {
  ListRegressionEventsResponse,
  RegressionArtifact,
  RegressionArtifactTreeNode,
  RegressionScenario,
} from "@coveritlabs/contracts";
import { EmptyState } from "../common/common";
import { RegressionScenarioArtifacts } from "./scenario-artifacts";
import { RegressionScenarioDetail } from "./scenario-detail";
import { RegressionScenarioEvents } from "./scenario-events";
import { RegressionScenarioList } from "./scenario-list";
import type { RegressionScenarioTab } from "../../../model/types/regression-runs.types";
import styles from "../../RegressionRuns.module.scss";

export function RegressionScenariosTab({
  scenarios,
  selectedScenario,
  selectedScenarioId,
  scenarioTab,
  onSelectScenario,
  onScenarioTabChange,
  scenarioEvents,
  scenarioArtifacts,
  scenarioArtifactTree,
  projectId,
  applicationId,
  runId,
}: {
  scenarios: RegressionScenario[];
  selectedScenario: RegressionScenario | null;
  selectedScenarioId: string | null;
  scenarioTab: RegressionScenarioTab;
  onSelectScenario: (scenarioId: string) => void;
  onScenarioTabChange: (tab: RegressionScenarioTab) => void;
  scenarioEvents: ListRegressionEventsResponse["events"];
  scenarioArtifacts: RegressionArtifact[];
  scenarioArtifactTree: RegressionArtifactTreeNode[];
  projectId: string;
  applicationId: string;
  runId: string;
}) {
  return (
    <div className={styles.scenarioSplit}>
      <RegressionScenarioList
        scenarios={scenarios}
        selectedScenarioId={selectedScenarioId}
        onSelectScenario={onSelectScenario}
      />

      <div className={styles.scenarioContent}>
        {!selectedScenario ? (
          <EmptyState
            title="Select a scenario"
            description="Choose a scenario to review its event timeline and captured artifacts."
          />
        ) : (
          <RegressionScenarioDetail
            scenario={selectedScenario}
            scenarioTab={scenarioTab}
            onScenarioTabChange={onScenarioTabChange}
          >
            {scenarioTab === "events" ? (
              <RegressionScenarioEvents events={scenarioEvents} />
            ) : (
          <RegressionScenarioArtifacts
            artifacts={scenarioArtifacts}
            artifactTree={scenarioArtifactTree}
            projectId={projectId}
            applicationId={applicationId}
            runId={runId}
              />
            )}
          </RegressionScenarioDetail>
        )}
      </div>
    </div>
  );
}
