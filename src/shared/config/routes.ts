// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

/** Route path constants — use these in Link, navigate(), and router config. */
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  OAUTH_CALLBACK: "/oauth/callback",

  PROFILE: "/profile",
  ADMINISTRATE: "/administrate",
  PROJECT_INTEGRATIONS: "/projects/:projectId/integrations",
  REGRESSION_RUNS: "/runs",

  DASHBOARD: "/dashboard",
  APPLICATIONS: "/applications",

  NOT_FOUND: "*",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
