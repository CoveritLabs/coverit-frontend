// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { AlertTriangle, Bug, RefreshCw } from "lucide-react";
import { Button } from "@shared/ui/Button/Button";
import styles from "./ContentErrorPanel.module.scss";

interface ContentErrorPanelProps {
  title: string;
  message?: string;
  error?: unknown;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return String(error);
}

export function ContentErrorPanel({
  title,
  message,
  error,
  onRetry,
  retryLabel = "Try again",
  className,
}: ContentErrorPanelProps) {
  const errorMessage = error ? getErrorMessage(error) : null;
  const errorStack = error instanceof Error ? error.stack : null;
  const classes = [styles.panel, className].filter(Boolean).join(" ");

  return (
    <section className={classes} role="alert" aria-live="polite">
      <div className={styles.iconCircle}>
        <AlertTriangle className={styles.icon} strokeWidth={1.5} />
      </div>

      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {message && <p className={styles.message}>{message}</p>}
      </div>

      {errorMessage && (
        <details className={styles.details}>
          <summary className={styles.summary}>
            <span className={styles.summaryLabel}>
              <Bug />
              Error details
            </span>
            <span className={styles.summaryNote}>Click to expand</span>
          </summary>
          <div className={styles.summaryBody}>
            <p className={styles.codeTitle}>Error message:</p>
            <code className={styles.codeBlock}>{errorMessage}</code>
            {errorStack && (
              <>
                <p className={styles.codeTitle}>Stack trace:</p>
                <pre className={styles.pre}>{errorStack}</pre>
              </>
            )}
          </div>
        </details>
      )}

      {onRetry && (
        <Button variant="primary" onClick={onRetry} className={styles.retryButton}>
          <RefreshCw />
          {retryLabel}
        </Button>
      )}
    </section>
  );
}
