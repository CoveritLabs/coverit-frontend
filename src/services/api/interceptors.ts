// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios'
import { tokenService } from '@services/auth/tokenService'
import { logger } from '@services/logging/logger'
import { ROUTES } from '@config/routes'

let isRefreshing = false
let refreshQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = []

export function attachAuthInterceptors(client: AxiosInstance): void {
    client.interceptors.request.use(
        (config: InternalAxiosRequestConfig) => {
            const token = tokenService.getAccessToken()
            if (token) config.headers.Authorization = `Bearer ${token}`
            return config
        },
        (error: unknown) => Promise.reject(error),
    )

    client.interceptors.response.use(
        (response) => response,
        async (error: AxiosError) => {
            const status = error.response?.status
            const url = error.config?.url ?? ''

            const isPublicAuthEndpoint = url.includes('auth/login') || url.includes('auth/signup') || url.includes('auth/oauth')
            if (status === 401 && !url.includes('auth/refresh') && !isPublicAuthEndpoint) {
                const refreshToken = tokenService.getRefreshToken()

                if (!refreshToken) {
                    tokenService.clearTokens()
                    window.location.replace(ROUTES.LOGIN)
                    return Promise.reject(error)
                }

                if (isRefreshing) {
                    return new Promise<string>((resolve, reject) => {
                        refreshQueue.push({ resolve, reject })
                    }).then((newToken) => {
                        error.config!.headers.Authorization = `Bearer ${newToken}`
                        return client(error.config!)
                    })
                }

                isRefreshing = true

                try {
                    const { data } = await client.post<{ tokens: { accessToken: string; refreshToken: string } }>(
                        'auth/refresh',
                        { refreshToken },
                    )
                    const newAccessToken = data.tokens.accessToken
                    tokenService.setTokens(newAccessToken, data.tokens.refreshToken)

                    refreshQueue.forEach(({ resolve }) => resolve(newAccessToken))
                    refreshQueue = []
                    isRefreshing = false

                    error.config!.headers.Authorization = `Bearer ${newAccessToken}`
                    return client(error.config!)
                } catch (refreshError) {
                    refreshQueue.forEach(({ reject }) => reject(refreshError))
                    refreshQueue = []
                    isRefreshing = false

                    logger.warn('Session expired — redirecting to login')
                    tokenService.clearTokens()
                    window.location.replace(ROUTES.LOGIN)
                    return Promise.reject(refreshError)
                }
            }

            if (status && status >= 500) {
                logger.error('API server error', { status, url: error.config?.url })
            }

            return Promise.reject(error)
        },
    )
}
