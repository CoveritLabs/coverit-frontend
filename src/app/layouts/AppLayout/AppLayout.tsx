// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { preloadRoute } from "@app/router/LazyRouter";
import { DocumentTitle } from "@app/router/DocumentTitle";
import styles from "./AppLayout.module.scss";

interface AppLayoutProps {
  children?: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      preloadRoute("applications");
      preloadRoute("testFlows");
      preloadRoute("regressionRuns");
      preloadRoute("manualSession");
      preloadRoute("userGuides");
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <div className={styles.shell}>
      <DocumentTitle />
      <Sidebar />
      <main className={styles.main}>{children ?? <Outlet />}</main>
    </div>
  );
}
