# Feature Development Guide

## How to Add a New Feature

Use this checklist whenever adding a new business domain (e.g. "documents", "payments").

### 1. Create the feature folder

```
src/features/<name>/
├── api/           API functions
├── components/    UI components unique to this domain
├── hooks/         useQuery / useMutation wrappers
├── types.ts       TypeScript interfaces
└── index.ts       Public barrel export
```

### 2. Define your types (`types.ts`)

```ts
import type { BaseEntity } from '@types/common'

export interface Document extends BaseEntity {
  title: string
  url: string
  policyId: string
}
```

### 3. Add query keys (`src/config/queryKeys.ts`)

```ts
documents: {
  all: ['documents'] as const,
  lists: () => [...queryKeys.documents.all, 'list'] as const,
  detail: (id: string) => [...queryKeys.documents.all, 'detail', id] as const,
},
```

### 4. Write API functions (`api/documentsApi.ts`)

```ts
import { apiClient } from '@services/api/client'
import type { ApiResponse, PaginatedResponse } from '@types/api'
import type { Document } from '../types'

export const fetchDocuments = async () => {
  const { data } = await apiClient.get<PaginatedResponse<Document>>('/documents')
  return data
}
```

### 5. Create query hooks (`hooks/useDocuments.ts`)

```ts
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@config/queryKeys'
import { fetchDocuments } from '../api/documentsApi'

export function useDocuments() {
  return useQuery({
    queryKey: queryKeys.documents.lists(),
    queryFn: fetchDocuments,
  })
}
```

### 6. Build components (`components/DocumentList/`)

```
components/DocumentList/
├── DocumentList.tsx
├── DocumentList.module.scss
└── index.ts
```

```tsx
// DocumentList.tsx
import { useDocuments } from '../../hooks/useDocuments'
import styles from './DocumentList.module.scss'

export function DocumentList() {
  const { data, isLoading, error } = useDocuments()

  if (isLoading) return <Spinner />
  if (error) return <ErrorState />

  return (
    <ul className={styles.list}>
      {data?.data.map((doc) => <li key={doc.id}>{doc.title}</li>)}
    </ul>
  )
}
```

### 7. Export from the barrel (`index.ts`)

```ts
export type { Document } from './types'
export { useDocuments } from './hooks/useDocuments'
export { DocumentList } from './components/DocumentList/DocumentList'
```

### 8. Add a route (if needed)

In `src/router/index.tsx`:
```tsx
{ path: ROUTES.DOCUMENTS, element: <Suspense fallback={<PageLoader />}><DocumentsPage /></Suspense> }
```

Add the constant in `src/config/routes.ts`:
```ts
DOCUMENTS: '/documents',
```

Add the lazy import in `src/router/lazyRoutes.ts`:
```ts
export const DocumentsPage = lazy(() => import('@pages/Documents/DocumentsPage'))
```

---

## Rules

- ✅ Features import from `@services`, `@types`, `@config`, `@utils`, `@components`, `@store`
- ✅ Features export from their own `index.ts` barrel
- ❌ Features must NOT import directly from other feature internals
- ❌ No business logic in page components — compose feature components and hooks instead
