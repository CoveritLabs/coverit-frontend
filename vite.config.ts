// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      '@tanstack/react-query',
      'axios',
      'lucide-react',
      'motion/react',
      'recharts',
      'react-router-dom',
      'sonner',
      'zustand',
    ],
  },
  server: {
    warmup: {
      clientFiles: [
        './src/app/App.tsx',
        './src/app/layouts/AppLayout/AppLayout.tsx',
        './src/app/layouts/AppLayout/Sidebar.tsx',
        './src/pages/Applications/Applications.tsx',
        './src/features/test-flows/ui/TestFlows.tsx',
        './src/features/regression-runs/ui/RegressionRuns.tsx',
        './src/features/manual-session/ui/ManualSession.tsx',
        './src/features/user-guides/ui/UserGuides.tsx',
      ],
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined

          const normalizedId = id.replace(/\\/g, '/')
          if (normalizedId.includes('/recharts/')) return 'vendor-charts'
          if (normalizedId.includes('/react-router') || normalizedId.includes('/@remix-run/')) return 'vendor-router'
          if (
            normalizedId.includes('/react/') ||
            normalizedId.includes('/react-dom/') ||
            normalizedId.includes('/scheduler/')
          ) {
            return 'vendor-react'
          }
          if (normalizedId.includes('/@tanstack/')) return 'vendor-query'
          if (normalizedId.includes('/lucide-react/')) return 'vendor-icons'
          if (normalizedId.includes('/motion/')) return 'vendor-motion'
          return 'vendor'
        },
      },
    },
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      'framer-motion': resolve(__dirname, './node_modules/framer-motion/dist/cjs/index.js'),
      '@': resolve(__dirname, './src'),
      '@app': resolve(__dirname, './src/app'),
      '@features': resolve(__dirname, './src/features'),
      '@pages': resolve(__dirname, './src/pages'),
      '@shared': resolve(__dirname, './src/shared'),
      '@assets': resolve(__dirname, './src/assets'),
    },
  },
})
