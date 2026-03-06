// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

/** Centralized access to environment variables. */
export const env = {
    apiUrl: import.meta.env.VITE_API_URL as string,
    appEnv: (import.meta.env.VITE_APP_ENV ?? 'development') as 'development' | 'staging' | 'production',
    isProd: import.meta.env.VITE_APP_ENV === 'production',
    isDev: import.meta.env.VITE_APP_ENV === 'development',
} as const
