// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { UserInfo, LoginRequest, SignupRequest } from '@coveritlabs/contracts'
import { authService } from '@services/auth/authService'

type Payload<T> = Omit<T, '$typeName'>

interface AuthState {
    user: UserInfo | null
    login: (data: Payload<LoginRequest>) => Promise<void>
    signup: (data: Payload<SignupRequest>) => Promise<void>
    logout: () => Promise<void>
    clearUser: () => void
}

export const useAuthStore = create<AuthState>()(
    devtools(
        persist(
            (set) => ({
                user: null,

                login: async (data) => {
                    const response = await authService.login(data)
                    set({ user: response.user ?? null }, false, 'auth/login')
                },

                signup: async (data) => {
                    const response = await authService.signup(data)
                    set({ user: response.user ?? null }, false, 'auth/signup')
                },

                logout: async () => {
                    try {
                        await authService.logout()
                    } finally {
                        set({ user: null }, false, 'auth/logout')
                    }
                },

                clearUser: () => set({ user: null }, false, 'auth/clearUser'),
            }),
            {
                name: 'coverit-auth',
                partialize: (state) => ({ user: state.user }),
            },
        ),
        { name: 'AuthStore' },
    ),
)
