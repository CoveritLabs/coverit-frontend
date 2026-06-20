// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import type { RegressionScenario } from "@coveritlabs/contracts";
import { Card } from "@shared/ui";
import { ExecutionStatusBadge, ResultDistribution, TabButton } from "../common/common";
import type { RegressionScenarioTab } from "../../../model/types/regression-runs.types";
import { formatDateTime, formatDuration, formatStatus } from "../../../lib/formatters";
import styles from "../../RegressionRuns.module.scss";

export function RegressionScenarioDetail({
  scenario,
  scenarioTab,
  onScenarioTabChange,
  children,
}: {
  scenario: RegressionScenario;
  scenarioTab: RegressionScenarioTab;
  onScenarioTabChange: (tab: RegressionScenarioTab) => void;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.scenarioDetailColumn}>
      <Card className={`${styles.panel} ${styles.summaryHeaderCard} ${styles.scenarioHeaderPanel}`}>
        <div className={styles.summaryHeaderMain}>
          <div>
            <h3>{scenario.title ?? scenario.scenarioName ?? scenario.scenarioKey}</h3>
          </div>
          <ExecutionStatusBadge status={scenario.status} warningCount={scenario.warningCount} />
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
    </div>
  );
}
