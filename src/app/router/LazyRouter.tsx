// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { lazy, Suspense } from "react";
import type { ComponentType, ReactNode } from "react";
import { PageLoader } from "@shared/feedback/PageLoader/PageLoader";

export const LazyLoginPage = lazy(() => import("@pages/auth/LoginPage/LoginPage"));
export const LazySignupPage = lazy(() => import("@pages/auth/SignupPage/SignupPage"));
export const LazyForgotPasswordPage = lazy(() => import("@pages/auth/ForgotPasswordPage/ForgotPasswordPage"));
export const LazyResetPasswordPage = lazy(() => import("@pages/auth/ResetPasswordPage/ResetPasswordPage"));
export const LazyOAuthCallbackPage = lazy(() => import("@pages/auth/OAuthCallbackPage/OAuthCallbackPage"));

export const LazyDashboard = lazy(() => import("@pages/Dashboard/Dashboard"));
export const LazyApplications = lazy(() => import("@pages/Applications/Applications"));
export const LazyRegressionRuns = lazy(() => import("@pages/RegressionRuns/RegressionRuns"));
export const LazyAdministration = lazy(() => import("@pages/Administration/Administration"));
export const LazyNotFound = lazy(() => import("@pages/NotFound/NotFound"));

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
