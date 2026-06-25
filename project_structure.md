# CoverIt Frontend — React + TS Project Structure

> Tailored for: **Vite + React 18 + TypeScript (SWC)** · Based on the existing repo at `coverit-frontend`

---

## 🎨 CSS Strategy Recommendation: **SCSS Modules**

| Option | Verdict | Rationale |
|---|---|---|
| **SCSS Modules** ✅ | **Recommended** | Scoped styles, nesting, variables/mixins, zero runtime, works great with Vite, enterprise-grade |
| Tailwind CSS | Good alt | Fastest prototyping, but utility soup at scale. Good if the team is already fluent |
| Vanilla CSS Modules | OK | Simpler than SCSS, but loses nesting/mixins |
| CSS-in-JS (Emotion, styled-components) | Avoid | Runtime cost, not ideal for a Vite-first SPA |

**Install:**
```bash
npm install -D sass
```
Vite has native SCSS support — no extra plugins needed.

**Convention:** Every component gets its own `.module.scss` file co-located next to it.

---

## 📁 Full Folder Structure

```
coverit-frontend/
├── public/                         # Static assets served as-is
│   ├── favicon.ico
│   ├── robots.txt
│   └── icons/                      # PWA/OG icons
│
├── src/
│   │
│   ├── main.tsx                    # App entry point
│   ├── App.tsx                     # Root component, global providers
│   ├── vite-env.d.ts
│   │
│   ├── assets/                     # Bundled static assets (images, fonts, svgs)
│   │   ├── images/
│   │   ├── fonts/
│   │   └── icons/                  # SVG icon files
│   │
│   ├── styles/                     # Global SCSS: tokens, resets, themes
│   │   ├── _tokens.scss            # Design tokens (colors, spacing, radii, etc.)
│   │   ├── _typography.scss        # Font stack, heading scale
│   │   ├── _reset.scss             # Normalize / CSS reset
│   │   ├── _mixins.scss            # Reusable mixins (respond-to, flex-center, etc.)
│   │   ├── _animations.scss        # Global keyframes
│   │   ├── themes/
│   │   │   ├── _light.scss
│   │   │   └── _dark.scss
│   │   └── index.scss              # Barrel — imports all partials above
│   │
│   ├── config/                     # App-level config (env vars, constants)
│   │   ├── env.ts                  # Typed wrapper around import.meta.env
│   │   ├── routes.ts               # Route path constants
│   │   └── queryKeys.ts            # React Query key factory
│   │
│   ├── router/                     # React Router v6 setup
│   │   ├── index.tsx               # createBrowserRouter / RouterProvider
│   │   ├── guards/                 # Route guards (PrivateRoute, RoleGuard, etc.)
│   │   │   ├── PrivateRoute.tsx
│   │   │   └── RoleGuard.tsx
│   │   └── lazyRoutes.ts           # Lazy-loaded page imports
│   │
│   ├── layouts/                    # Page shell components (Sidebar + Header combos)
│   │   ├── AppLayout/
│   │   │   ├── AppLayout.tsx
│   │   │   └── AppLayout.module.scss
│   │   ├── AuthLayout/
│   │   │   ├── AuthLayout.tsx
│   │   │   └── AuthLayout.module.scss
│   │   └── DashboardLayout/
│   │       ├── DashboardLayout.tsx
│   │       └── DashboardLayout.module.scss
│   │
│   ├── pages/                      # Top-level route pages (thin, compose features)
│   │   ├── Home/
│   │   ├── Login/
│   │   ├── Register/
│   │   ├── Dashboard/
│   │   ├── Profile/
│   │   ├── Settings/
│   │   └── NotFound/
│   │
│   ├── features/                   # 🔑 Core business domains (vertical slices)
│   │   │
│   │   ├── auth/                   # Authentication & session
│   │   │   ├── api/                # Auth API calls (login, logout, refresh)
│   │   │   ├── components/         # LoginForm, RegisterForm, OtpInput, etc.
│   │   │   ├── hooks/              # useAuth, useCurrentUser
│   │   │   ├── store/              # Auth Zustand slice or Context
│   │   │   ├── types/              # AuthUser, TokenPayload, etc.
│   │   │   └── index.ts            # Public barrel export
│   │   │
│   │   ├── policies/               # Cover-it core: insurance policies
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── store/
│   │   │   ├── types/
│   │   │   └── index.ts
│   │   │
│   │   ├── claims/                 # Claims management
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── types/
│   │   │   └── index.ts
│   │   │
│   │   ├── quotes/                 # Quote generation flow
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── types/
│   │   │   └── index.ts
│   │   │
│   │   ├── notifications/          # In-app notification system
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── index.ts
│   │   │
│   │   ├── dashboard/              # Dashboard widgets & analytics
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── index.ts
│   │   │
│   │   └── settings/              # User account & org settings
│   │       ├── api/
│   │       ├── components/
│   │       ├── hooks/
│   │       └── index.ts
│   │
│   ├── components/                 # 🧩 Shared, dumb UI components (design system)
│   │   ├── ui/                     # Primitives — Button, Input, Badge, etc.
│   │   │   ├── Button/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Button.module.scss
│   │   │   │   └── index.ts
│   │   │   ├── Input/
│   │   │   ├── Select/
│   │   │   ├── Modal/
│   │   │   ├── Toast/
│   │   │   ├── Spinner/
│   │   │   ├── Avatar/
│   │   │   ├── Badge/
│   │   │   ├── Card/
│   │   │   ├── Tooltip/
│   │   │   └── ...
│   │   │
│   │   ├── layout/                 # Structural helpers (Container, Grid, Stack, Divider)
│   │   │   ├── Container/
│   │   │   ├── Grid/
│   │   │   ├── Stack/
│   │   │   └── Divider/
│   │   │
│   │   ├── feedback/               # User feedback (EmptyState, ErrorBoundary, Skeleton)
│   │   │   ├── EmptyState/
│   │   │   ├── ErrorBoundary/
│   │   │   └── Skeleton/
│   │   │
│   │   └── data-display/           # Charts, Tables, etc.
│   │       ├── Table/
│   │       └── Chart/
│   │
│   ├── hooks/                      # 🪝 Global reusable hooks
│   │   ├── useDebounce.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useMediaQuery.ts
│   │   ├── useOnClickOutside.ts
│   │   ├── useTheme.ts
│   │   ├── useKeyPress.ts
│   │   └── usePagination.ts
│   │
│   ├── store/                      # 🗃️ Global state (Zustand recommended)
│   │   ├── index.ts                # Combined store or root slice
│   │   ├── uiStore.ts              # Modal open, sidebar collapsed, theme, etc.
│   │   ├── authStore.ts            # If not already in features/auth/store
│   │   └── notificationStore.ts
│   │
│   ├── services/                   # 🔌 Infrastructure/external integrations
│   │   ├── api/
│   │   │   ├── client.ts           # Axios/fetch instance (base URL, interceptors)
│   │   │   ├── interceptors.ts     # Auth token injection, 401 refresh logic
│   │   │   └── endpoints.ts        # Endpoint path constants
│   │   │
│   │   ├── auth/
│   │   │   └── tokenService.ts     # JWT encode/decode, storage helpers
│   │   │
│   │   ├── analytics/
│   │   │   └── analyticsService.ts # Posthog / Segment / GA wrapper
│   │   │
│   │   ├── featureFlags/
│   │   │   └── flagsService.ts     # LaunchDarkly / GrowthBook / local JSON flags
│   │   │
│   │   ├── errorTracking/
│   │   │   └── sentryService.ts    # Sentry init & error boundary wrapper
│   │   │
│   │   ├── logging/
│   │   │   └── logger.ts           # Structured logger (dev console, prod Sentry)
│   │   │
│   │   ├── storage/
│   │   │   └── storageService.ts   # Typed localStorage / sessionStorage wrapper
│   │   │
│   │   └── websocket/
│   │       └── wsClient.ts         # WebSocket / SSE client (live notifications, etc.)
│   │
│   ├── lib/                        # 📦 Third-party library wrappers & initializers
│   │   ├── reactQuery.ts           # QueryClient setup & provider
│   │   ├── i18n.ts                 # i18next setup
│   │   └── dayjs.ts                # dayjs locale/plugins config
│   │
│   ├── types/                      # 📐 Shared TypeScript types & interfaces
│   │   ├── api.ts                  # Generic ApiResponse<T>, PaginatedResponse<T>
│   │   ├── common.ts               # Id, Nullable, Maybe, etc.
│   │   ├── env.d.ts                # Vite ImportMeta env type augmentation
│   │   └── index.ts                # Barrel re-export
│   │
│   ├── utils/                      # 🔧 Pure utility functions (no side-effects)
│   │   ├── formatters.ts           # Date, currency, phone formatters
│   │   ├── validators.ts           # Email, phone, password validators
│   │   ├── cn.ts                   # classnames/clsx helper
│   │   ├── sleep.ts
│   │   └── assertNever.ts          # Exhaustive type check
│   │
│   ├── constants/                  # Application-wide constants
│   │   ├── roles.ts                # USER_ROLES enum
│   │   ├── breakpoints.ts          # Responsive breakpoints
│   │   ├── policyTypes.ts          # Cover-it domain: policy type enums
│   │   └── index.ts
│   │
│   ├── i18n/                       # 🌍 Internationalization
│   │   ├── locales/
│   │   │   ├── en/
│   │   │   │   ├── common.json
│   │   │   │   ├── auth.json
│   │   │   │   └── policies.json
│   │   │   └── ar/                 # RTL support (if needed)
│   │   └── index.ts
│   │
│   └── test/                       # 🧪 Test utilities & setup
│       ├── setup.ts                # Vitest global setup (MSW, jest-dom matchers)
│       ├── mocks/
│       │   ├── server.ts           # MSW mock server
│       │   └── handlers/           # Per-feature API mock handlers
│       │       ├── auth.handlers.ts
│       │       └── policies.handlers.ts
│       └── utils/
│           ├── renderWithProviders.tsx   # Custom render with QueryClient + Router + Zustand
│           └── factories/               # Test data factories (Faker.js)
│               ├── userFactory.ts
│               └── policyFactory.ts
│
├── docs/                           # Architecture & process docs (existing)
│   ├── branching.md
│   ├── commit-convention.md
│   ├── docker-images.md
│   ├── git-hooks.md
│   └── github-actions.md
│
├── scripts/                        # Build & tooling scripts (existing)
│
├── .github/
│   └── workflows/                  # GitHub Actions CI/CD
│
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── eslint.config.js
├── package.json
├── .gitignore
├── .husky/
└── commitlint.config.js
```

---

## 📦 Recommended Package Stack

### Core
| Purpose | Package |
|---|---|
| Routing | `react-router-dom` v7 |
| Server state | `@tanstack/react-query` v5 |
| Global UI state | `zustand` |
| HTTP client | `axios` |
| Forms | `react-hook-form` + `zod` |

### Styling
| Purpose | Package |
|---|---|
| CSS preprocessing | `sass` (SCSS Modules) |
| Class merging | `clsx` + `tailwind-merge` (optional) |
| Icons | `lucide-react` |
| Animations | `framer-motion` |

### Quality & DX
| Purpose | Package |
|---|---|
| Testing | `vitest` + `@testing-library/react` |
| API mocking | `msw` v2 |
| Test data | `@faker-js/faker` |
| Storybook | `storybook` (component docs) |
| Bundle analysis | `rollup-plugin-visualizer` |

### Observability
| Purpose | Package |
|---|---|
| Error tracking | `@sentry/react` |
| Analytics | `posthog-js` |
| Feature flags | `growthbook` or JSON local flags |
| i18n | `i18next` + `react-i18next` |

---

## 🏛️ Key Architectural Decisions

### Feature-First (`features/`) vs Component-First
Each business domain lives in `features/<domain>/` as a **vertical slice**: its own API calls, components, hooks, types, and store slice — all co-located. Shared, reusable UI-only components live in `components/`.

### Path Aliases (add to [vite.config.ts](file:///e:/GitHub/coverit-frontend/vite.config.ts) + [tsconfig.app.json](file:///e:/GitHub/coverit-frontend/tsconfig.app.json))
```ts
// vite.config.ts
resolve: {
  alias: {
    '@': '/src',
    '@features': '/src/features',
    '@components': '/src/components',
    '@hooks': '/src/hooks',
    '@services': '/src/services',
    '@store': '/src/store',
    '@utils': '/src/utils',
    '@types': '/src/types',
    '@config': '/src/config',
    '@styles': '/src/styles',
  }
}
```

### Env Variable Pattern
```ts
// src/config/env.ts
export const env = {
  apiUrl: import.meta.env.VITE_API_URL,
  sentryDsn: import.meta.env.VITE_SENTRY_DSN,
  appEnv: import.meta.env.VITE_APP_ENV ?? 'development',
} as const
```

---

## 📋 Phased Implementation Order

1. **Foundation** — styles/, config/, types/, utils/, lib/ setup
2. **Infrastructure** — services/api client + interceptors, store setup
3. **Auth feature** — login/register flow, guards, token service
4. **Shell** — layouts/, router, AppLayout with sidebar/header
5. **Domain features** — policies, claims, quotes (parallel)
6. **Testing layer** — MSW, Vitest, renderWithProviders
7. **Observability** — Sentry, analytics, feature flags
