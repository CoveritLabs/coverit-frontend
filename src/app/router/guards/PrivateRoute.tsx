// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { Navigate, Outlet } from "react-router-dom";
import { tokenService } from "@features/auth";
import { ROUTES } from "@shared/config/routes";

/** Redirects unauthenticated or expired-session users to /login. */
export function PrivateRoute() {
  if (!tokenService.hasValidSession()) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }
  return <Outlet />;
}
