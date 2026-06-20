// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import type { RegressionRun } from "@coveritlabs/contracts";
import { Badge, Card } from "@shared/ui";
import { cn } from "@shared/utils/cn";
import { formatStatus } from "../../../lib/formatters";
import styles from "../../RegressionRuns.module.scss";

function getStatusTone(status: RegressionRun["status"]) {
  if (status === "passed") return styles.statusPassed;
  if (status === "failed") return styles.statusFailed;
  return styles.statusRunning;
}

export function RunStatusBadge({ status }: { status: RegressionRun["status"] }) {
  return <Badge className={`${styles.statusBadge} ${getStatusTone(status)}`}>{formatStatus(status)}</Badge>;
}

export function ExecutionStatusBadge({
  status,
  warningCount = 0,
}: {
  status: RegressionRun["status"];
  warningCount?: number;
}) {
  if (status === "passed" && warningCount > 0) {
    return <Badge className={`${styles.statusBadge} ${styles.statusWarning}`}>Warning</Badge>;
  }

  return <RunStatusBadge status={status} />;
}

export function ResultDistribution({
  passed,
  warnings,
  failed,
  compact = false,
}: {
  passed: number;
  warnings: number;
  failed: number;
  compact?: boolean;
}) {
  return (
    <div className={cn(styles.resultSummary, compact && styles.resultSummaryCompact)}>
      <Badge variant="outline" className={styles.resultBadgePassed} title="Pass">
        {passed} P
      </Badge>
      <Badge variant="outline" className={styles.resultBadgeWarning} title="Warn">
        {warnings} W
      </Badge>
      <Badge variant="outline" className={styles.resultBadgeFailed} title="Fail">
        {failed} F
      </Badge>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Card className={styles.emptyState}>
      <div className={styles.emptyIcon}>
        <AlertCircle size={20} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
    </Card>
  );
}

export function MetricCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "good" | "bad";
}) {
  return (
    <Card className={styles.metricCard}>
      <span className={styles.metricLabel}>{label}</span>
      <span className={tone === "good" ? styles.metricValueGood : tone === "bad" ? styles.metricValueBad : styles.metricValue}>
        {value}
      </span>
    </Card>
  );
}

export function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button type="button" className={active ? `${styles.tabButton} ${styles.tabButtonActive}` : styles.tabButton} onClick={onClick}>
      {children}
    </button>
  );
}
