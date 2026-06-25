// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { AppWindow, Clock3, RefreshCw, Workflow } from "lucide-react";
import { Button } from "@shared/ui";
import { cn } from "@shared/utils/cn";
import styles from "../TestFlows.module.scss";

export function TestFlowsHeader({
  applicationName,
  flowCount,
  latestFlowAt,
  isRefreshing,
  onRefresh,
}: {
  applicationName: string | null;
  flowCount: number;
  latestFlowAt?: string;
  isRefreshing: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className={styles.header}>
      <div>
        <h1 className={styles.headerTitle}>Test Flows</h1>
        <p className={styles.headerSubtitle}>
          Review generated navigation flows by application, version, checkpoint, and crawl session.
        </p>
      </div>

      <div className={styles.headerMeta}>
        <Button
          size="sm"
          variant="ghost"
          className={styles.refreshButton}
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Refresh test flows"
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
          <Workflow size={16} />
          <span>{flowCount} flows</span>
        </div>
        {latestFlowAt && (
          <div className={styles.headerMetaItem}>
            <Clock3 size={16} />
            <span>Latest {latestFlowAt}</span>
          </div>
        )}
      </div>
    </div>
  );
}
