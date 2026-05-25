# State Management Guide

> **Stack:** React Query (server state) + Zustand (client state)

---

## The Core Distinction

| State type | Tool | Examples |
|---|---|---|
| **Server state** (remote data) | React Query | Policies list, Claim detail, User profile |
| **UI state** (local/global) | Zustand | Sidebar open, theme, modal visibility |
| **Form state** | React Hook Form | Login form, Policy creation wizard |
| **URL state** | React Router | Filters, pagination, selected tab |

> **Rule:** If data comes from or goes to the server, it belongs in React Query.
> If it controls UI appearance or transient interactions, it belongs in Zustand.

---

## React Query

### Query Key Factory
All query keys are defined in `src/config/queryKeys.ts`.

```ts
import { queryKeys } from '@config/queryKeys'

// Precise invalidation by granularity:
queryClient.invalidateQueries({ queryKey: queryKeys.policies.all })
queryClient.invalidateQueries({ queryKey: queryKeys.policies.detail('abc-123') })
```

### Writing a query hook

```ts
// src/features/policies/hooks/usePolicies.ts
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@config/queryKeys'
import { fetchPolicies } from '../api/policiesApi'

export function usePolicies(filters = {}) {
  return useQuery({
    queryKey: queryKeys.policies.list(filters),
    queryFn: () => fetchPolicies(filters),
  })
}
```

### Writing a mutation hook

```ts
// src/features/policies/hooks/useCreatePolicy.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@config/queryKeys'
import { createPolicy } from '../api/policiesApi'

export function useCreatePolicy() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createPolicy,
    onSuccess: () => {
      // Invalidate the entire policies list cache
      queryClient.invalidateQueries({ queryKey: queryKeys.policies.lists() })
    },
  })
}
```

---

## Zustand

All stores live in `src/store/`. Each store uses the `devtools` middleware
for Redux DevTools support, and `persist` only for data that should survive page reloads.

### Reading from a store

```ts
// Select a single value (preferred — avoids unnecessary re-renders)
const theme = useUIStore((s) => s.theme)

// Select an action
const setTheme = useUIStore((s) => s.setTheme)
```

### Adding a new store

```ts
// src/store/notificationStore.ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface NotificationState {
  unreadCount: number
  setUnreadCount: (n: number) => void
}

export const useNotificationStore = create<NotificationState>()(
  devtools(
    (set) => ({
      unreadCount: 0,
      setUnreadCount: (n) => set({ unreadCount: n }, false, 'notification/setUnreadCount'),
    }),
    { name: 'NotificationStore' },
  ),
)
```

Then export from `src/store/index.ts`:

```ts
export { useNotificationStore } from './notificationStore'
```
