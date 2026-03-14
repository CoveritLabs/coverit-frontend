// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import axios from 'axios'
import { env } from '@config/env'
import { attachAuthInterceptors } from '@services/api/interceptors'

export const apiClient = axios.create({
    baseURL: env.apiUrl,
    timeout: 15_000,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
})

attachAuthInterceptors(apiClient)
