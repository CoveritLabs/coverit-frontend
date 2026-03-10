// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

const ACCESS_TOKEN_KEY = 'coverit_access_token'
const REFRESH_TOKEN_KEY = 'coverit_refresh_token'

let _accessToken: string | null = null

export const tokenService = {
    setTokens(accessToken: string, refreshToken: string): void {
        _accessToken = accessToken
        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
    },

    getAccessToken(): string | null {
        return _accessToken ?? localStorage.getItem(ACCESS_TOKEN_KEY)
    },

    getRefreshToken(): string | null {
        return localStorage.getItem(REFRESH_TOKEN_KEY)
    },

    clearTokens(): void {
        _accessToken = null
        localStorage.removeItem(ACCESS_TOKEN_KEY)
        localStorage.removeItem(REFRESH_TOKEN_KEY)
    },

    hasSession(): boolean {
        return Boolean(tokenService.getAccessToken())
    },

    /**
     * Decode JWT payload and return `exp` as milliseconds since epoch or null.
     */
    getAccessTokenExpiry(): number | null {
        const token = tokenService.getAccessToken()
        if (!token) return null
        try {
            const parts = token.split('.')
            if (parts.length < 2) return null
            const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
            const json = atob(base64)
            const payload = JSON.parse(json)
            if (!payload || typeof payload.exp !== 'number') return null
            return payload.exp * 1000
        } catch (e) {
            return null
        }
    },

    isAccessTokenExpired(): boolean {
        const exp = tokenService.getAccessTokenExpiry()
        if (!exp) return false
        return Date.now() > exp
    },

    /**
     * Returns true if there is a token and it's NOT expired.
     */
    hasValidSession(): boolean {
        return Boolean(tokenService.getAccessToken()) && !tokenService.isAccessTokenExpired()
    },
}
