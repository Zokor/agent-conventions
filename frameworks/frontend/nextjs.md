# Next.js Conventions (Agent-Friendly)

> For React-specific patterns (components, hooks, state), see [react.md](react.md).
> This file covers Next.js-specific conventions only.

## App Router Structure (Next.js 13+)

The `app/` directory follows Next.js routing conventions. For non-routing code, choose by project size (see [SKILL.md](../../SKILL.md)):

### Concern-first (small/medium projects)

```
src/
├── app/
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   ├── loading.tsx              # Loading UI
│   ├── error.tsx                # Error boundary
│   ├── not-found.tsx            # 404 page
│   ├── (auth)/                  # Route group (no URL segment)
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── users/
│   │   ├── page.tsx             # /users
│   │   ├── [id]/
│   │   │   └── page.tsx         # /users/[id]
│   │   └── actions.ts           # Server actions for users
│   └── api/
│       └── users/
│           └── route.ts         # API route handler
├── components/
│   ├── layout/                  # Header, Footer, Sidebar
│   ├── ui/                      # Button, Modal, Input
│   └── users/                   # User-specific components
├── hooks/                       # Reactive data fetching (TanStack Query/SWR)
├── services/                    # Business logic, orchestration
├── api/                         # Raw HTTP calls (fetch/axios)
├── validators/                  # Zod/Yup schemas
├── types/
├── lib/
```

### Feature-first (large projects)

```
src/
├── app/                         # (same routing structure as above)
├── components/
│   ├── layout/                  # Header, Footer, Sidebar
│   └── ui/                      # Button, Modal, Input
├── features/
│   └── users/
│       ├── components/
│       ├── hooks/               # Reactive data fetching
│       ├── services/            # Business logic
│       ├── api/                 # Raw HTTP calls
│       ├── validators/          # Zod/Yup schemas
│       ├── types/
│       ├── enums/
│       └── actions/             # Server actions
├── shared/
│   ├── lib/
│   └── types/
```

Rules:
- Use App Router for new projects
- Route groups `(name)` for organization without URL impact
- Keep page components thin — delegate to feature or concern-level components
- Shared UI (layout, primitives) always lives in `components/layout/` and `components/ui/`
- Server Actions can live in `app/` routes or `features/`

## Server vs Client Components

### Default to Server Components

```tsx
// app/users/page.tsx — Server Component (default)
import { UserList } from '@/features/users/components/UserList'
import { getUsers } from '@/features/users/actions/queries'

export default async function UsersPage() {
  const users = await getUsers()

  return (
    <main>
      <h1>Users</h1>
      <UserList users={users} />
    </main>
  )
}
```

### Mark Client Components explicitly

```tsx
// features/users/components/UserSearch.tsx
'use client'

import { useState } from 'react'

export function UserSearch({ onSearch }: { onSearch: (query: string) => void }) {
  const [query, setQuery] = useState('')

  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && onSearch(query)}
    />
  )
}
```

Rules:
- Server Components: data fetching, heavy dependencies, no interactivity
- Client Components: `useState`, `useEffect`, event handlers, browser APIs
- Add `'use client'` only when needed
- Pass server data to client components as props

## Server Actions

### Define actions with 'use server'

```tsx
// features/users/actions/mutations.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
})

export async function createUser(formData: FormData) {
  const parsed = CreateUserSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten() }
  }

  const user = await db.user.create({ data: parsed.data })

  revalidatePath('/users')
  redirect(`/users/${user.id}`)
}

export async function deleteUser(userId: string) {
  await db.user.delete({ where: { id: userId } })
  revalidatePath('/users')
}
```

### Use actions in forms

```tsx
// app/users/new/page.tsx
import { createUser } from '@/features/users/actions/mutations'

export default function NewUserPage() {
  return (
    <form action={createUser}>
      <input name="name" required />
      <input name="email" type="email" required />
      <button type="submit">Create User</button>
    </form>
  )
}
```

### Use actions with useTransition for loading states

```tsx
'use client'

import { useTransition } from 'react'
import { deleteUser } from '@/features/users/actions/mutations'

export function DeleteButton({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(() => deleteUser(userId))}
    >
      {isPending ? 'Deleting...' : 'Delete'}
    </button>
  )
}
```

## Data Fetching

### Fetch in Server Components

```tsx
// features/users/actions/queries.ts
import { cache } from 'react'

export const getUser = cache(async (id: string) => {
  const user = await db.user.findUnique({ where: { id } })
  if (!user) notFound()
  return user
})

export const getUsers = cache(async () => {
  return db.user.findMany({ orderBy: { createdAt: 'desc' } })
})
```

```tsx
// app/users/[id]/page.tsx
import { getUser } from '@/features/users/actions/queries'

export default async function UserPage({ params }: { params: { id: string } }) {
  const user = await getUser(params.id)
  return <UserProfile user={user} />
}
```

### Generate static params

```tsx
// app/users/[id]/page.tsx
export async function generateStaticParams() {
  const users = await db.user.findMany({ select: { id: true } })
  return users.map((user) => ({ id: user.id }))
}
```

## API Routes

### Route handlers in app/api

```tsx
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const role = searchParams.get('role')

  const users = await db.user.findMany({
    where: role ? { role } : undefined,
  })

  return NextResponse.json(users)
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  const user = await db.user.create({ data: body })

  return NextResponse.json(user, { status: 201 })
}
```

```tsx
// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await db.user.findUnique({ where: { id: params.id } })

  if (!user) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(user)
}
```

## Middleware

```tsx
// middleware.ts (root level)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')

  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
}
```

## Metadata

```tsx
// app/users/[id]/page.tsx
import type { Metadata } from 'next'

export async function generateMetadata({ params }): Promise<Metadata> {
  const user = await getUser(params.id)

  return {
    title: user.name,
    description: `Profile of ${user.name}`,
  }
}
```

## Loading and Error States

```tsx
// app/users/loading.tsx
export default function Loading() {
  return <UserListSkeleton />
}

// app/users/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong</h2>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

## Environment Variables

```bash
# .env.local
DATABASE_URL=postgresql://...
NEXT_PUBLIC_API_URL=https://api.example.com  # Exposed to browser
```

Rules:
- `NEXT_PUBLIC_` prefix exposes to browser
- Server-only vars: no prefix
- Never commit `.env.local`

See [react.md](react.md) for React component patterns.
See [languages/typescript.md](../../languages/typescript.md) for TypeScript conventions.
