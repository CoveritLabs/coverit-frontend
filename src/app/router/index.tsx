// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ROUTES } from "@shared/config/routes";
import { AppLayout } from "@app/layouts/AppLayout/AppLayout";
import { AuthLayout } from "@app/layouts/AuthLayout/AuthLayout";
import {
  LazyDashboard,
  LazyApplications,
  LazyManualSession,
  LazyAdministration,
  LazyRegressionRuns,
  LazyTestFlows,
  LazyUserGuides,
  LazyForgotPasswordPage,
  LazyFlowEditor,
  LazyLoginPage,
  LazyNotFound,
  LazyOAuthCallbackPage,
  LazyResetPasswordPage,
  LazySignupPage,
  withSuspense,
} from "./LazyRouter";
import { RouterErrorFallback } from "@shared/feedback/ErrorBoundary/ErrorFallback";
import { PrivateRoute } from "./guards/PrivateRoute";

const LoginPage = withSuspense(LazyLoginPage);
const SignupPage = withSuspense(LazySignupPage);
const ForgotPasswordPage = withSuspense(LazyForgotPasswordPage);
const ResetPasswordPage = withSuspense(LazyResetPasswordPage);
const OAuthCallbackPage = withSuspense(LazyOAuthCallbackPage);

const Dashboard = withSuspense(LazyDashboard);
const Applications = withSuspense(LazyApplications);
const ManualSession = withSuspense(LazyManualSession);
const RegressionRuns = withSuspense(LazyRegressionRuns);
const TestFlows = withSuspense(LazyTestFlows);
const FlowEditor = withSuspense(LazyFlowEditor);
const UserGuides = withSuspense(LazyUserGuides);
const Administration = withSuspense(LazyAdministration);
const NotFound = withSuspense(LazyNotFound);

/** Main application router */
const router = createBrowserRouter([
  {
    element: <PrivateRoute />,
    errorElement: <RouterErrorFallback />,
    children: [
      {
        element: <AppLayout />,
        errorElement: <RouterErrorFallback />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: ROUTES.DASHBOARD, element: <Dashboard /> },
          { path: ROUTES.APPLICATIONS, element: <Applications /> },
          { path: ROUTES.MANUAL_RECORDINGS, element: <ManualSession /> },
          { path: ROUTES.MANUAL_RECORDING, element: <ManualSession /> },
          { path: ROUTES.ADMINISTRATE, element: <Administration /> },
          { path: ROUTES.PROJECT_INTEGRATIONS, element: <Administration /> },
          { path: ROUTES.REGRESSION_RUNS, element: <RegressionRuns /> },
          { path: ROUTES.TEST_FLOWS, element: <TestFlows /> },
          { path: ROUTES.TEST_FLOW_EDITOR, element: <FlowEditor /> },
          { path: ROUTES.USER_GUIDES, element: <UserGuides /> },
        ],
      },
    ],
  },
  {
    element: <AuthLayout />,
    errorElement: <RouterErrorFallback />,
    children: [
      { path: ROUTES.REGISTER, element: <SignupPage /> },
      { path: ROUTES.LOGIN, element: <LoginPage /> },
      { path: ROUTES.FORGOT_PASSWORD, element: <ForgotPasswordPage /> },
      { path: ROUTES.RESET_PASSWORD, element: <ResetPasswordPage /> },
    ],
  },
  {
    path: ROUTES.OAUTH_CALLBACK,
    element: <OAuthCallbackPage />,
    errorElement: <RouterErrorFallback />,
  },
  {
    path: ROUTES.NOT_FOUND,
    element: <NotFound />,
    errorElement: <RouterErrorFallback />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
