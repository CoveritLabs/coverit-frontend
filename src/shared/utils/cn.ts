// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { clsx, type ClassValue } from 'clsx'

/** Conditionally join class names. */
export function cn(...inputs: ClassValue[]): string {
    return clsx(...inputs)
}
