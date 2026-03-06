// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ROUTES } from "@config/routes";
import { AppLayout } from "@layouts/AppLayout/AppLayout";
import { LazyDashboard, LazyNotFound, withSuspense } from "./LazyRouter";
import { RouterErrorFallback } from "@components/feedback/ErrorBoundary/ErrorFallback";

const Dashboard = withSuspense(LazyDashboard);
const NotFound = withSuspense(LazyNotFound);

/** Main application router */
const router = createBrowserRouter([
  {
    element: <AppLayout />,
    errorElement: <RouterErrorFallback />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: ROUTES.DASHBOARD, element: <Dashboard /> },
    ],
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
