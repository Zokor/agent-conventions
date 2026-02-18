# TypeScript Conventions (Agent-Friendly)

## Compiler Settings

Enable strict mode in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

## Type Safety

### Prefer `unknown` over `any`

```ts
// ✅ Good — forces type narrowing
function parse(input: unknown): User {
  if (isUser(input)) return input
  throw new Error('Invalid user')
}

// ❌ Bad — bypasses type safety
function parse(input: any): User {
  return input
}
```

### Use type guards for narrowing

```ts
// ✅ Good — type predicate
function isUser(value: unknown): value is User {
  return typeof value === 'object' && value !== null && 'id' in value
}

// Use with narrowing
if (isUser(data)) {
  console.log(data.id) // TypeScript knows `data` is User
}
```

### Prefer discriminated unions over optional fields

```ts
// ✅ Good — exhaustive checking
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: Error }

function handle(result: Result<User>) {
  if (result.success) {
    return result.data // TypeScript knows data exists
  }
  throw result.error // TypeScript knows error exists
}

// ❌ Bad — ambiguous state
type Result<T> = {
  success: boolean
  data?: T
  error?: Error
}
```

## Utility Types

Use built-in utility types instead of manual definitions:

```ts
// Common utilities
Partial<T>      // All properties optional
Required<T>     // All properties required
Pick<T, K>      // Subset of properties
Omit<T, K>      // Exclude properties
Record<K, V>    // Object with keys K and values V
Readonly<T>     // All properties readonly

// Examples
type UserUpdate = Partial<User>
type UserSummary = Pick<User, 'id' | 'name'>
type UserWithoutPassword = Omit<User, 'password'>
```

## Constants and Enums

### Prefer `as const` for literal types

```ts
// ✅ Good — type-safe, tree-shakable
export const UserRole = {
  Admin: 'admin',
  Member: 'member',
} as const

type UserRole = typeof UserRole[keyof typeof UserRole]
// type UserRole = 'admin' | 'member'

// ❌ Avoid — not tree-shakable, has runtime cost
enum UserRole {
  Admin = 'admin',
  Member = 'member',
}
```

### Use `satisfies` for type checking with inference

```ts
// ✅ Good — validates shape, keeps literal types
const config = {
  api: 'https://api.example.com',
  timeout: 5000,
} satisfies Config

// `config.api` is typed as 'https://api.example.com', not string
```

## Generics

### Constrain generics when possible

```ts
// ✅ Good — constrained
function getProperty<T extends object, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key]
}

// ❌ Bad — too loose
function getProperty<T, K>(obj: T, key: K): any {
  return (obj as any)[key]
}
```

### Use default generic parameters

```ts
// ✅ Good — sensible default
type Response<T = unknown> = {
  data: T
  status: number
}

const res: Response = { data: {}, status: 200 } // T defaults to unknown
```

## Imports and Exports

### Use path aliases

```ts
// ✅ Good — absolute imports
import { UserService } from '@/services/UserService'
import type { User } from '@/types/user'

// ❌ Bad — fragile relative paths
import { UserService } from '../../../services/UserService'
```

### Separate type imports

```ts
// ✅ Good — clear intent, better tree-shaking
import type { User, UserRole } from '@/types/user'
import { createUser } from '@/services/user'

// Also good — inline type imports
import { createUser, type User } from '@/features/users'
```

## Null Handling

### Prefer nullish coalescing over logical OR

```ts
// ✅ Good — only falls back on null/undefined
const value = input ?? 'default'

// ❌ Bad — falls back on 0, '', false
const value = input || 'default'
```

### Use optional chaining

```ts
// ✅ Good
const city = user?.address?.city

// ❌ Bad
const city = user && user.address && user.address.city
```

## Testing

- Test observable behavior via public interfaces (exported functions, API routes, UI interactions), not private internals.
- Do not write tests that only restate TypeScript compile-time checks (e.g., impossible union states, missing required properties, invalid generic constraints).
- Write tests for runtime behavior that TypeScript cannot prove (business rules, error paths, I/O boundaries, serialization/deserialization).

## File Organization

Follow the universal concern-bucket pattern:
- `types/user.ts` — user-related types only
- `enums/user.ts` — user-related const objects / unions
- `errors/user.ts` — user-related error classes

See [SKILL.md](../SKILL.md) for full file organization rules.
