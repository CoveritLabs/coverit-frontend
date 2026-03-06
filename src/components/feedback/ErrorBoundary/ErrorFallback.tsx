// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import {
  useRouteError,
  isRouteErrorResponse,
  useNavigate,
} from "react-router-dom";
import { Button } from "@components/ui/Button/Button";
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";
import type { ErrorInfo } from "react";
import styles from "./ErrorFallback.module.scss";

interface ErrorFallbackProps {
  error: unknown;
  errorInfo?: ErrorInfo | null;
  onReset?: () => void;
}

export const ErrorFallback = ({
  error,
  errorInfo,
  onReset,
}: ErrorFallbackProps) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : null;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Icon */}
        <div className={styles.center}>
          <div className={styles.relative}>
            <div className={styles.iconCircle}>
              <AlertTriangle className={styles.icon} strokeWidth={1.5} />
            </div>
            <div className={styles.accentTopRight} />
            <div className={styles.accentBottomLeft} />
          </div>
        </div>

        {/* Text Content */}
        <div className={styles.header}>
          <h1 className={styles.title}>Something went wrong</h1>
          <p className={styles.desc}>
            An unexpected error occurred. Don't worry, you can try refreshing
            the page or going back to the dashboard.
          </p>
        </div>

        {/* Error Details */}
        {error && (
          <details className={styles.details}>
            <summary className={styles.summary}>
              <span className={styles.summaryLabel}>
                <Bug className="" />
                Error Details
              </span>
              <span className={styles.summaryNote}>Click to expand</span>
            </summary>
            <div className={styles.summaryBody}>
              <div>
                <p className={styles.codeTitle}>Error Message:</p>
                <code className={styles.codeBlock}>{errorMessage}</code>
                {(errorStack || errorInfo) && (
                  <div style={{ marginTop: "0.5rem" }}>
                    <p className={styles.codeTitle}>Stack Trace:</p>
                    <pre className={styles.pre}>
                      {errorInfo?.componentStack ?? errorStack}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </details>
        )}

        {/* Action Buttons */}
        <div className={styles.actions}>
          <Button
            onClick={onReset ?? (() => window.location.reload())}
            className={styles.btnGap}
            variant="primary"
          >
            <RefreshCw />
            Try Again
          </Button>
          <Button
            variant="outline"
            className={styles.btnGap}
            onClick={() => (window.location.href = "/")}
          >
            <Home />
            Go to Dashboard
          </Button>
        </div>

        {/* Additional Help */}
        <div className={styles.help}>
          <p className={styles.desc}>
            If this problem persists, please contact support with the error
            details above.
          </p>
          <div className={styles.helpList}>
            {/* TODO: Connect these buttons to real support channels */}
            <button className={styles.helpBtn}>Report Issue</button>
            <button className={styles.helpBtn}>Check Status</button>
            <button className={styles.helpBtn}>Contact Support</button>
          </div>
        </div>
      </div>
    </div>
  );
};

/** Adapter for use as a React Router `errorElement` */
export const RouterErrorFallback = () => {
  const error = useRouteError();
  const navigate = useNavigate();

  const normalized = isRouteErrorResponse(error)
    ? new Error(`${error.status} ${error.statusText}`)
    : error instanceof Error
      ? error
      : new Error(String(error));

  return <ErrorFallback error={normalized} onReset={() => navigate(0)} />;
};
