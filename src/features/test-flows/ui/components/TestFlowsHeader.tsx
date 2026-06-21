// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { AppWindow, Clock3, Workflow } from "lucide-react";
import styles from "../TestFlows.module.scss";

export function TestFlowsHeader({
  applicationName,
  flowCount,
  latestFlowAt,
}: {
  applicationName: string | null;
  flowCount: number;
  latestFlowAt?: string;
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
