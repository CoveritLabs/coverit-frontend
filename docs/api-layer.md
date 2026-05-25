# API Layer Guide

## Overview

All HTTP communication goes through `src/services/api/client.ts` — a single configured Axios instance.
Never create a bare `axios.create()` call anywhere else.

## File Map

```
src/services/api/
├── client.ts       Axios instance (base URL, timeout, headers)
├── interceptors.ts Token injection + 401 handling
└── endpoints.ts    (optional) endpoint path constants

src/config/
└── queryKeys.ts    React Query key factory
```

## Making API Calls

Create one API function file per feature domain in `features/<name>/api/`:

```ts
// src/features/policies/api/policiesApi.ts
import { apiClient } from '@services/api/client'
import type { ApiResponse, PaginatedResponse, ListParams } from '@types/api'
import type { Policy } from '../types'

export async function fetchPolicies(params: ListParams) {
  const { data } = await apiClient.get<PaginatedResponse<Policy>>('/policies', { params })
  return data
}

export async function fetchPolicy(id: string) {
  const { data } = await apiClient.get<ApiResponse<Policy>>(`/policies/${id}`)
  return data.data
}

export async function createPolicy(payload: Partial<Policy>) {
  const { data } = await apiClient.post<ApiResponse<Policy>>('/policies', payload)
  return data.data
}

export async function updatePolicy(id: string, payload: Partial<Policy>) {
  const { data } = await apiClient.patch<ApiResponse<Policy>>(`/policies/${id}`, payload)
  return data.data
}

export async function deletePolicy(id: string) {
  await apiClient.delete(`/policies/${id}`)
}
```

## Request Interceptor (Token Injection)

The interceptor in `interceptors.ts` automatically injects the Bearer token:

```
Request → interceptor reads tokenService.getAccessToken() → adds Authorization header → API
```

## Response Interceptor (401 Handling)

On a 401 response:
1. Clears all tokens via `tokenService.clearTokens()`
2. Redirects to `/login`
3. **TODO:** Implement refresh token flow before step 1

## Error Handling in Components

Use React Query's built-in error state — don't try/catch inside query functions:

```tsx
const { data, error, isLoading } = useQuery(...)

if (isLoading) return <Spinner />
if (error) return <ErrorState message={error.message} />
return <PolicyList policies={data} />
```

For mutations, use the `onError` callback:

```ts
useMutation({
  mutationFn: createPolicy,
  onError: (err) => toast.error(err.message),
})
```
