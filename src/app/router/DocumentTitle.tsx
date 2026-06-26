// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { useEffect } from "react";
import { matchPath, useLocation } from "react-router-dom";
import { ROUTES } from "@shared/config/routes";

const APP_NAME = "CoverIt";

const ROUTE_TITLES = [
  { path: ROUTES.TEST_FLOW_EDITOR, title: "Flow Editor" },
  { path: ROUTES.MANUAL_RECORDING, title: "Manual Recording" },
  { path: ROUTES.PROJECT_INTEGRATIONS, title: "Project Integrations" },
  { path: ROUTES.DASHBOARD, title: "Dashboard" },
  { path: ROUTES.APPLICATIONS, title: "Applications" },
  { path: ROUTES.MANUAL_RECORDINGS, title: "Manual Recordings" },
  { path: ROUTES.ADMINISTRATE, title: "Administration" },
  { path: ROUTES.REGRESSION_RUNS, title: "Regression Runs" },
  { path: ROUTES.TEST_FLOWS, title: "Test Flows" },
  { path: ROUTES.USER_GUIDES, title: "User Guides" },
  { path: ROUTES.REGISTER, title: "Create Account" },
  { path: ROUTES.LOGIN, title: "Sign In" },
  { path: ROUTES.FORGOT_PASSWORD, title: "Forgot Password" },
  { path: ROUTES.RESET_PASSWORD, title: "Reset Password" },
  { path: ROUTES.OAUTH_CALLBACK, title: "Signing In" },
  { path: ROUTES.HOME, title: "Dashboard" },
] as const;

function getRouteTitle(pathname: string) {
  return ROUTE_TITLES.find(({ path }) => matchPath({ path, end: true }, pathname))?.title;
}

export function DocumentTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    const routeTitle = getRouteTitle(pathname);
    document.title = routeTitle ? `${routeTitle} | ${APP_NAME}` : APP_NAME;
  }, [pathname]);

  return null;
}
