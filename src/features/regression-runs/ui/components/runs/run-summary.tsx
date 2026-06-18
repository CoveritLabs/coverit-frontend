// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { Card } from "@shared/ui";
import { ExecutionStatusBadge, ResultDistribution } from "../common/common";
import type { RegressionRunListItem } from "../../../model/types/regression-runs.types";
import { formatDateTime, formatDuration, formatRelativeTime } from "../../../lib/formatters";
import styles from "../../RegressionRuns.module.scss";

export function RegressionRunSummary({ run }: { run: RegressionRunListItem }) {
  return (
    <Card className={`${styles.panel} ${styles.summaryHeaderCard}`}>
      <div className={styles.summaryHeaderMain}>
        <div>
          <h3>{run.displayName}</h3>
        </div>
        <ExecutionStatusBadge status={run.status} warningCount={run.warningCount} />
      </div>

      <div className={styles.summaryHeaderMeta}>
        <span className={`${styles.summaryHeaderMetric} ${styles.summaryHeaderMetricWide}`}>
          <span>Version</span>
          <strong className={styles.runVersionPill}>{run.versionName}</strong>
        </span>
        <span className={styles.summaryHeaderMetric}>
          <span>Duration</span>
          <strong>{formatDuration(run.durationMs)}</strong>
        </span>
        <span className={styles.summaryHeaderMetric}>
          <span>Started</span>
          <strong>{formatDateTime(run.startedAt ?? run.createdAt)}</strong>
        </span>
        <span className={styles.summaryHeaderMetric}>
          <span>Updated</span>
          <strong>{formatRelativeTime(run.updatedAt)}</strong>
        </span>
        <span className={styles.summaryHeaderMetric}>
          <span>Results</span>
          <ResultDistribution passed={run.passedCount} warnings={run.warningCount} failed={run.failedCount} compact />
        </span>
      </div>
    </Card>
  );
}
