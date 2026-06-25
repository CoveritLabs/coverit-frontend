// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { lazy, Suspense } from "react";
import type { ComponentType, ReactNode } from "react";
import { PageLoader } from "@shared/feedback/PageLoader/PageLoader";

const routeImporters = {
  login: () => import("@pages/auth/LoginPage/LoginPage"),
  signup: () => import("@pages/auth/SignupPage/SignupPage"),
  forgotPassword: () => import("@pages/auth/ForgotPasswordPage/ForgotPasswordPage"),
  resetPassword: () => import("@pages/auth/ResetPasswordPage/ResetPasswordPage"),
  oauthCallback: () => import("@pages/auth/OAuthCallbackPage/OAuthCallbackPage"),
  dashboard: () => import("@pages/Dashboard/Dashboard"),
  applications: () => import("@pages/Applications/Applications"),
  manualSession: () => import("@pages/ManualSession/ManualSession"),
  regressionRuns: () => import("@pages/RegressionRuns/RegressionRuns"),
  testFlows: () => import("@pages/TestFlows/TestFlows"),
  flowEditor: () => import("@pages/TestFlows/FlowEditor"),
  userGuides: () => import("@pages/UserGuides/UserGuides"),
  administration: () => import("@pages/Administration/Administration"),
  notFound: () => import("@pages/NotFound/NotFound"),
} as const;

export type LazyRouteKey = keyof typeof routeImporters;

const preloadedRoutes = new Set<LazyRouteKey>();

export function preloadRoute(route: LazyRouteKey) {
  if (preloadedRoutes.has(route)) return;
  preloadedRoutes.add(route);
  void routeImporters[route]().catch(() => {
    preloadedRoutes.delete(route);
  });
}

export const LazyLoginPage = lazy(routeImporters.login);
export const LazySignupPage = lazy(routeImporters.signup);
export const LazyForgotPasswordPage = lazy(routeImporters.forgotPassword);
export const LazyResetPasswordPage = lazy(routeImporters.resetPassword);
export const LazyOAuthCallbackPage = lazy(routeImporters.oauthCallback);

export const LazyDashboard = lazy(routeImporters.dashboard);
export const LazyApplications = lazy(routeImporters.applications);
export const LazyManualSession = lazy(routeImporters.manualSession);
export const LazyRegressionRuns = lazy(routeImporters.regressionRuns);
export const LazyTestFlows = lazy(routeImporters.testFlows);
export const LazyFlowEditor = lazy(routeImporters.flowEditor);
export const LazyUserGuides = lazy(routeImporters.userGuides);
export const LazyAdministration = lazy(routeImporters.administration);
export const LazyNotFound = lazy(routeImporters.notFound);

interface WithSuspenseProps {
  fallback?: ReactNode;
}

export function withSuspense<P extends object>(
  Component: ComponentType<P>,
  { fallback = <PageLoader /> }: WithSuspenseProps = {},
) {
  return function SuspenseWrapper(props: P) {
    return (
      <Suspense fallback={fallback}>
        <Component {...props} />
      </Suspense>
    );
  };
}
