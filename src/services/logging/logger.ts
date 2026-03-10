// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { env } from '@config/env'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export const logger = {
    debug(message: string, context?: Record<string, unknown>): void {
        if (env.isDev) console.debug(`[DEBUG] ${message}`, context ?? '')
    },

    info(message: string, context?: Record<string, unknown>): void {
        if (env.isDev) console.info(`[INFO] ${message}`, context ?? '')
    },

    warn(message: string, context?: Record<string, unknown>): void {
        console.warn(`[WARN] ${message}`, context ?? '')
    },

    error(message: string, context?: Record<string, unknown>): void {
        console.error(`[ERROR] ${message}`, context ?? '')
    },
} satisfies Record<LogLevel, (message: string, context?: Record<string, unknown>) => void>
