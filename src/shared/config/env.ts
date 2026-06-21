// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

const apiUrl = (import.meta.env.VITE_API_URL as string)?.replace(/\/?$/, '/');
const configuredWsUrl = (import.meta.env.VITE_WS_URL as string | undefined)?.replace(/\/?$/, '/');
const derivedWsUrl = apiUrl?.replace(/^http/i, (protocol) => (protocol.toLowerCase() === 'https' ? 'wss' : 'ws'));

/** Centralized access to environment variables. */
export const env = {
    apiUrl,
    wsUrl: configuredWsUrl ?? derivedWsUrl,
    appEnv: (import.meta.env.VITE_APP_ENV ?? 'development') as 'development' | 'staging' | 'production',
    isProd: import.meta.env.VITE_APP_ENV === 'production',
    isDev: import.meta.env.VITE_APP_ENV === 'development',
} as const
