// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { Card } from "@shared/ui";
import { ExecutionStatusBadge, ResultDistribution } from "../common/common";
import { formatDuration, formatStatus } from "../../../lib/formatters";
import type { RegressionScenarioWithReports } from "../../../model/types/regression-runs.types";
import styles from "../../RegressionRuns.module.scss";

export function RegressionScenarioList({
  scenarios,
  selectedScenarioId,
  onSelectScenario,
}: {
  scenarios: RegressionScenarioWithReports[];
  selectedScenarioId: string | null;
  onSelectScenario: (scenarioId: string) => void;
}) {
  return (
    <Card className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h3>Scenarios</h3>
          <p>{scenarios.length} scenario{scenarios.length === 1 ? "" : "s"}</p>
        </div>
      </div>

      {scenarios.length === 0 ? (
        <div className={styles.panelEmpty}>No scenarios recorded for this run yet.</div>
      ) : (
        <div className={styles.scenarioList}>
          {scenarios.map((scenario) => (
            <button
              key={scenario.id}
              type="button"
              className={scenario.id === selectedScenarioId ? `${styles.scenarioItem} ${styles.scenarioItemActive}` : styles.scenarioItem}
              onClick={() => onSelectScenario(scenario.id)}
            >
              <div className={styles.scenarioItemHeader}>
                <span className={styles.scenarioName}>{scenario.title ?? scenario.scenarioName ?? scenario.scenarioKey}</span>
                <ExecutionStatusBadge status={scenario.status} warningCount={scenario.warningCount} />
              </div>
              <div className={styles.scenarioGridMeta}>
                <span>{formatStatus(scenario.status)}</span>
                <span>{formatDuration(scenario.durationMs)}</span>
              </div>
              <ResultDistribution
                passed={scenario.passedCount}
                warnings={scenario.warningCount}
                failed={scenario.failedCount}
                compact
              />
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}
