// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { lazy, Suspense } from "react";
import type { ComponentType, ReactNode } from "react";
import { PageLoader } from "@components/feedback/PageLoader/PageLoader";

export const LazyDashboard = lazy(() => import("@pages/Dashboard/Dashboard"));
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
