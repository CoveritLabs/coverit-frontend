// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { QueryClient } from '@tanstack/react-query'
import { env } from '@config/env'

/** Global React Query client with default global options */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes
            retry: 2,
            refetchOnWindowFocus: env.isProd,
        },
        mutations: {
            retry: 1,
        },
    },
})
