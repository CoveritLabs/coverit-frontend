// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ROUTES } from '@config/routes'
import { AppLayout } from '@layouts/AppLayout/AppLayout'

/** Main application router */
const router = createBrowserRouter([
    {
        element: <AppLayout />,
        children: [
            // TODO: Add lazy page routes here as features are built
            { path: ROUTES.DASHBOARD, element: <div>Dashboard</div> },
        ],
    },
    { path: ROUTES.NOT_FOUND, element: <div>404 — Not Found</div> },
])

export function AppRouter() {
    return <RouterProvider router={router} />
}
