// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { Card } from "@shared/ui";
import { ExecutionStatusBadge, ResultDistribution } from "../common/common";
import type { RegressionRunListItem } from "../../../model/types/regression-runs.types";
import { formatDateTime, formatRelativeTime } from "../../../lib/formatters";
import styles from "../../RegressionRuns.module.scss";

export function RegressionRunsList({
  runs,
  selectedRunId,
  onSelectRun,
}: {
  runs: RegressionRunListItem[];
  selectedRunId: string | null;
  onSelectRun: (runId: string) => void;
}) {
  return (
    <Card className={styles.listPanel}>
      <div className={styles.panelHeader}>
        <div>
          <h3>Runs</h3>
          <p>
            {runs.length} result{runs.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {runs.length === 0 ? (
        <div className={styles.panelEmpty}>No runs match the current filters.</div>
      ) : (
        <div className={styles.cardList}>
          {runs.map((run) => (
            <button
              key={run.id}
              type="button"
              className={`${styles.runCard} ${run.runId === selectedRunId ? styles.runCardSelected : ""}`}
              onClick={() => onSelectRun(run.runId)}
            >
              <div className={styles.runCardHeader}>
                <div className={styles.runCardTitle}>
                  <span className={styles.runTitle}>{run.displayName}</span>
                  <span className={styles.runTimestamp} title={formatDateTime(run.startedAt ?? run.createdAt)}>
                    <span className={styles.runVersionPill}>{run.versionName}</span>
                    <span>{formatRelativeTime(run.startedAt ?? run.createdAt)}</span>
                  </span>
                </div>
                <ExecutionStatusBadge status={run.status} warningCount={run.warningCount} />
              </div>

              <ResultDistribution passed={run.passedCount} warnings={run.warningCount} failed={run.failedCount} />
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}
