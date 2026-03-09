// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { Outlet } from "react-router-dom";
import type { ReactNode } from "react";
import styles from "./AuthLayout.module.scss";

interface AuthLayoutProps {
  children?: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className={styles.shell}>
      <div className={styles.card}>{children ?? <Outlet />}</div>
    </div>
  );
}
