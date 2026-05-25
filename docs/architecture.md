# Architecture Overview

> **Status: living document.** Updated as the project evolves.

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Build tool | Vite 6 + SWC | Blazing-fast bundling and HMR |
| UI | React 18 | Component rendering + Concurrent features |
| Language | TypeScript 5.7 (strict) | Type safety across the whole codebase |
| Routing | React Router v7 | Client-side routing, code splitting |
| Server state | TanStack React Query v5 | Data fetching, caching, background sync |
| Client state | Zustand | Lightweight global UI state |
| Forms | React Hook Form + Zod | Performant forms with schema validation |
| HTTP | Axios | API client with interceptors |
| Styling | SCSS Modules | Scoped styles, design tokens, theming |
| Icons | Lucide React | Consistent icon set |
| Animation | Framer Motion | Spring-based micro-animations |
| Testing | Vitest + Testing Library + MSW | Unit, integration, and API mocking |
| Error tracking | Sentry | Production error capture |
| Analytics | PostHog | Product analytics |

---

## Folder Anatomy

```
src/
├── assets/         Static assets (images, fonts, SVGs)
├── components/     Shared, domain-agnostic UI primitives
├── config/         Typed env wrapper, route constants, RQ key factory
├── constants/      App-wide enums and lookup objects
├── features/       Business domain vertical slices (see below)
├── hooks/          Reusable React hooks
├── i18n/           Internationalisation locale files + i18next config
├── layouts/        Page shell components (AppLayout, AuthLayout)
├── lib/            Third-party library init (QueryClient, dayjs, etc.)
├── pages/          Route-level page components (thin, compose features)
├── router/         createBrowserRouter setup + route guards
├── services/       Infrastructure: Axios client, token, logger, storage, WS
├── store/          Zustand stores
├── styles/         Global SCSS: tokens, reset, typography, themes
├── test/           Test utilities, MSW mock server, data factories
├── types/          Shared TypeScript types and interfaces
└── utils/          Pure utility functions (formatters, validators, cn)
```

---

## Data Flow

```
Page (thin, composes features)
  └── Feature Component (business logic)
        ├── useQuery / useMutation  → React Query → Axios → API
        │                                      ↑
        │                               interceptors.ts
        │                               (token injection, 401 handling)
        └── Zustand store (UI state only: sidebar, theme, modals)
```

---

## Feature Slice Pattern

Each domain lives in `features/<name>/` as a vertical slice:

```
features/policies/
├── api/            API functions using apiClient
├── components/     Domain components (PolicyCard, PolicyList, etc.)
├── hooks/          useQuery wrappers (usePolicies, usePolicy)
├── store/          Zustand slice (if needed for local feature state)
├── types.ts        TypeScript interfaces for this domain
└── index.ts        Public barrel — only export what others need
```

**Rule:** Features must not import from other features directly.
Use the public `index.ts` barrel only.

---

## Theme System

Themes are implemented via CSS custom properties on the `<html>` element:

- `[data-theme="light"]` — set by Zustand `useUIStore.setTheme()`
- `[data-theme="dark"]`

The token system has two layers:
1. **Static SCSS variables** in `_tokens.scss` (design palette)
2. **CSS custom properties** in `themes/_light.scss` / `_dark.scss` (semantic, theme-aware)

Components always reference CSS vars (`var(--color-bg-primary)`) never raw SCSS variables.

---

## Path Aliases

All src imports use `@` prefixed aliases. Never use relative `../../` beyond one level up.

| Alias | Resolves to |
|---|---|
| `@/*` | `src/*` |
| `@features/*` | `src/features/*` |
| `@components/*` | `src/components/*` |
| `@services/*` | `src/services/*` |
| `@store/*` | `src/store/*` |
| `@config/*` | `src/config/*` |
| `@styles/*` | `src/styles/*` |
| `@hooks/*` | `src/hooks/*` |
| `@utils/*` | `src/utils/*` |
| `@types/*` | `src/types/*` |
| `@lib/*` | `src/lib/*` |
| `@constants/*` | `src/constants/*` |
