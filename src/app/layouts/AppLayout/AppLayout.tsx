// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { Outlet } from "react-router-dom";
import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import styles from "./AppLayout.module.scss";

interface AppLayoutProps {
  children?: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <main className={styles.main}>{children ?? <Outlet />}</main>
    </div>
  );
}
