// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import type { ReactNode } from "react";
import { cn } from "@shared/utils/cn";
import styles from "./TerminalPanel.module.scss";

interface TerminalPanelProps {
  title: ReactNode;
  status?: ReactNode;
  footerLeft?: ReactNode;
  footerRight?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function TerminalPanel({
  title,
  status,
  footerLeft,
  footerRight,
  children,
  className,
  bodyClassName,
}: TerminalPanelProps) {
  return (
    <section className={cn(styles.terminal, className)}>
      <div className={styles.titleBar}>
        <div className={styles.titleLeft}>
          <span className={styles.dots} aria-hidden="true">
            <span className={styles.dotRed} />
            <span className={styles.dotYellow} />
            <span className={styles.dotGreen} />
          </span>
          <div className={styles.title}>{title}</div>
        </div>
        {status ? <div className={styles.status}>{status}</div> : null}
      </div>

      <div className={cn(styles.body, bodyClassName)}>{children}</div>

      {(footerLeft || footerRight) && (
        <div className={styles.footer}>
          <div>{footerLeft}</div>
          <div>{footerRight}</div>
        </div>
      )}
    </section>
  );
}
