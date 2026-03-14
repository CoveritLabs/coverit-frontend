// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { Outlet, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useEffect } from "react";
import styles from "./AuthLayout.module.scss";
import { tokenService } from "@services/auth/tokenService";
import { ROUTES } from "@config/routes";

interface AuthLayoutProps {
  children?: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const navigate = useNavigate();

  useEffect(() => {
    if (tokenService.hasValidSession()) {
      navigate(ROUTES.DASHBOARD, { replace: true });
    }
  }, [navigate]);

  return (
    <div className={styles.shell}>
      <div className={styles.card}>{children ?? <Outlet />}</div>
    </div>
  );
}
