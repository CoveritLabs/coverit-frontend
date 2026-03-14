// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { Navigate, Outlet } from "react-router-dom";
import { tokenService } from "@services/auth/tokenService";
import { ROUTES } from "@config/routes";

/** Redirects unauthenticated or expired-session users to /login. */
export function PrivateRoute() {
  if (!tokenService.hasValidSession()) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }
  return <Outlet />;
}
