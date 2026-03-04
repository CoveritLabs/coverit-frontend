// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { Theme } from '@app-types/common'

interface UIState {
    theme: Theme
    setTheme: (theme: Theme) => void
}

/** UI Store for managing global UI state */
export const useUIStore = create<UIState>()(
    devtools(
        persist(
            (set) => ({
                theme: 'system',
                setTheme: (theme) => {
                    set({ theme }, false, 'ui/setTheme')
                    const root = document.documentElement
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
                    const isDark = theme === 'dark' || (theme === 'system' && prefersDark)
                    root.classList.toggle('dark', isDark)
                },
            }),
            {
                name: 'coverit-ui',
            },
        ),
        { name: 'UIStore' },
    ),
)
