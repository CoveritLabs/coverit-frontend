// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { ArrowLeft, Wifi, WifiOff } from "lucide-react";
import { formatElapsed, statusLabel } from "../../lib/manual-session-formatters";
import styles from "../ManualSession.module.scss";

type ManualSessionHeaderProps = {
  appName: string;
  versionName: string;
  sessionId: string;
  currentUrl: string;
  currentTitle: string;
  isLive: boolean;
  status: string;
  ttlRemainingSeconds: number | null;
  elapsedSeconds: number;
  onBack: () => void;
};

export function ManualSessionHeader({
  appName,
  versionName,
  sessionId,
  currentUrl,
  currentTitle,
  isLive,
  status,
  ttlRemainingSeconds,
  elapsedSeconds,
  onBack,
}: ManualSessionHeaderProps) {
  return (
    <header className={styles.statusBar}>
      <div className={styles.headerIdentity}>
        <button type="button" className={styles.headerBackButton} onClick={onBack} aria-label="Back to applications">
          <ArrowLeft className={styles.buttonIcon} />
        </button>
        <div className={styles.recordingTitle}>
          <strong>Manual Recording</strong>
          <span>
            {appName} / {versionName}
            {sessionId ? ` / ${sessionId}` : ""}
          </span>
        </div>
      </div>

      <div className={styles.statusCluster}>
        <span className={styles.urlText} title={currentUrl}>
          {currentTitle || currentUrl || sessionId}
        </span>
        <span className={styles.statusGroup}>
          {isLive ? <Wifi className={styles.statusIcon} /> : <WifiOff className={styles.statusIcon} />}
          <span className={isLive ? styles.statusDotLive : styles.statusDotIdle} />
          <span className={styles.statusText}>{statusLabel(status)}</span>
        </span>
        {ttlRemainingSeconds !== null && (
          <span className={styles.idleTimer} title="Idle session time remaining">
            Idle {formatElapsed(ttlRemainingSeconds)}
          </span>
        )}
        <span className={styles.timer}>{formatElapsed(elapsedSeconds)}</span>
      </div>
    </header>
  );
}
