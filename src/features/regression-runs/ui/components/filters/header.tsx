// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { AppWindow, Clock3, RefreshCw } from "lucide-react";
import { Button } from "@shared/ui";
import { cn } from "@shared/utils/cn";
import styles from "../../RegressionRuns.module.scss";
import { formatDateTime } from "../../../lib/formatters";

export function RegressionRunsHeader({
  applicationName,
  latestRunAt,
  runCount,
  isRefreshing,
  onRefresh,
}: {
  applicationName: string | null;
  latestRunAt?: string;
  runCount: number;
  isRefreshing: boolean;
  onRefresh: () => void;
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
        <Button
          size="sm"
          variant="ghost"
          className={styles.refreshButton}
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Refresh regression runs"
          title="Refresh"
        >
          <RefreshCw size={14} className={cn(isRefreshing && styles.spinIcon)} />
        </Button>
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
