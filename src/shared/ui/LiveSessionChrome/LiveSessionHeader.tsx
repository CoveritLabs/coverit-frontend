// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { ArrowLeft, Wifi, WifiOff } from "lucide-react";
import styles from "./LiveSessionChrome.module.scss";

type LiveSessionHeaderProps = {
  title: string;
  detail: string;
  sessionId: string;
  currentUrl: string;
  currentTitle: string;
  isLive: boolean;
  statusLabel: string;
  ttlRemainingLabel?: string | null;
  elapsedLabel: string;
  backLabel: string;
  onBack: () => void;
};

export function LiveSessionHeader({
  title,
  detail,
  sessionId,
  currentUrl,
  currentTitle,
  isLive,
  statusLabel,
  ttlRemainingLabel = null,
  elapsedLabel,
  backLabel,
  onBack,
}: LiveSessionHeaderProps) {
  return (
    <header className={styles.statusBar}>
      <div className={styles.headerIdentity}>
        <button type="button" className={styles.headerBackButton} onClick={onBack} aria-label={backLabel}>
          <ArrowLeft className={styles.statusIcon} />
        </button>
        <div className={styles.headerTitle}>
          <strong>{title}</strong>
          <span>{detail}</span>
        </div>
      </div>

      <div className={styles.statusCluster}>
        <span className={styles.urlText} title={currentUrl}>
          {currentTitle || currentUrl || sessionId}
        </span>
        <span className={styles.statusGroup}>
          {isLive ? <Wifi className={styles.statusIcon} /> : <WifiOff className={styles.statusIcon} />}
          <span className={isLive ? styles.statusDotLive : styles.statusDotIdle} />
          <span className={styles.statusText}>{statusLabel}</span>
        </span>
        {ttlRemainingLabel ? (
          <span className={styles.idleTimer} title="Idle session time remaining">
            {ttlRemainingLabel}
          </span>
        ) : null}
        <span className={styles.timer}>{elapsedLabel}</span>
      </div>
    </header>
  );
}
