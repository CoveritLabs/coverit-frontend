// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { AppWindow, Clock3 } from "lucide-react";
import styles from "../../RegressionRuns.module.scss";
import { formatDateTime } from "../../../lib/formatters";

export function RegressionRunsHeader({
  applicationName,
  latestRunAt,
  runCount,
}: {
  applicationName: string | null;
  latestRunAt?: string;
  runCount: number;
}) {
  return (
    <div className={styles.header}>
      <div>
        <h1 className={styles.headerTitle}>Regression Runs</h1>
        <p className={styles.headerSubtitle}>
          Monitor execution health, inspect scenario failures, and review captured artifacts without losing drill-down
          context.
        </p>
      </div>

      <div className={styles.headerMeta}>
        {applicationName && (
          <div className={styles.headerMetaItem}>
            <AppWindow size={16} />
            <span>{applicationName}</span>
          </div>
        )}
        <div className={styles.headerMetaItem}>
          <span>{runCount} runs</span>
        </div>
        {latestRunAt && (
          <div className={styles.headerMetaItem}>
            <Clock3 size={16} />
            <span>Latest {formatDateTime(latestRunAt)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
