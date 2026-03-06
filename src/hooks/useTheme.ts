// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { useUIStore } from '@/store'
import type { Theme } from '@app-types/common'

/** Reads and sets the application theme. DOM application is handled by ThemeProvider. */
export function useTheme(): { theme: Theme; setTheme: (t: Theme) => void } {
    return {
        theme: useUIStore((s) => s.theme),
        setTheme: useUIStore((s) => s.setTheme),
    }
}
