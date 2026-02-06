# React / TypeScript Conventions

## Component File Organization

Choose the approach that fits your project size (see [SKILL.md](../../SKILL.md) for full guidance).

### Concern-first (small/medium projects)

```
src/
  components/
    layout/
      Header.tsx              ← structural shell
      Footer.tsx
      Sidebar.tsx
    ui/
      Button.tsx              ← shared primitives
      Modal.tsx
    users/
      UserCard.tsx            ← one component per file
      UserCard.test.tsx       ← colocated test
  hooks/
    useUserData.ts
  types/
    user.ts                   ← user-only types/contracts
  enums/
    user.ts
```

### Feature-first (large projects)

```
src/
  components/
    layout/
      Header.tsx              ← structural shell
      Footer.tsx
      Sidebar.tsx
    ui/
      Button.tsx              ← shared primitives
      Modal.tsx
  features/users/
    components/
      UserCard.tsx            ← one component per file
      UserCard.test.tsx       ← colocated test
      UserCard.stories.tsx    ← colocated story (if using Storybook)
    hooks/
      useUserData.ts
      useUserData.test.ts
    types/
      user.ts                 ← user-only types/contracts
    enums/
      user.ts                 ← user-only enums
    constants/
      user.ts                 ← user-only constants
    errors/
      user.ts                 ← user-only errors
    index.ts                  ← public surface re-exports
```

## Component Rules

### Prefer function declarations for exported components

```tsx
// ✅ Good — grep-able, hoisted
export function UserCard({ user }: UserCardProps) {
  return <div>{user.name}</div>
}

// ❌ Bad — anonymous to tooling
export default ({ user }) => <div>{user.name}</div>
```

### Props: always define a named type

```tsx
// ✅ Good
type UserCardProps = {
  user: User
  onSelect: (id: string) => void
}

export function UserCard({ user, onSelect }: UserCardProps) {}

// ❌ Bad — inline, not reusable, not grep-able
export function UserCard({ user, onSelect }: { user: any; onSelect: Function }) {}
```

### No dynamic styled-components — prefer Tailwind or CSS modules

```tsx
// ✅ Good
<div className="flex items-center gap-2 rounded-lg bg-white p-4">

// ❌ Bad — generates new class names at runtime, breaks grep
const StyledDiv = styled.div`
  display: ${props => props.isVisible ? 'flex' : 'none'};
`
```

### No plain text in HTML elements — use i18n or constants

```tsx
// ✅ Good
<button>{t('actions.save')}</button>
<button>{LABELS.save}</button>

// ❌ Acceptable for prototypes, bad for production
<button>Save Changes</button>
```

## Hooks Rules

### Custom hooks: prefix with `use`, one hook per file

```
hooks/
  useAuth.ts
  useDebounce.ts
  useUserData.ts
```

### Avoid useEffect in custom hooks when possible

Prefer derived state, useMemo, or event handlers. When useEffect is necessary, document why.

```tsx
// ✅ Good — derived state
const fullName = useMemo(() => `${first} ${last}`, [first, last])

// ❌ Bad — effect for derived state
useEffect(() => {
  setFullName(`${first} ${last}`)
}, [first, last])
```

## State Management

- Local UI state → `useState` / `useReducer`
- Server state → TanStack Query / SWR
- Global app state → Zustand / Context (sparingly)
- Form state → React Hook Form / Formik
- URL state → URL search params

## Testing Conventions

- Test files colocated: `Component.test.tsx`
- Use `@testing-library/react`, not Enzyme
- Test behavior, not implementation details
- Mock API calls with MSW, not manual fetch mocks
- Jest mocks must use absolute paths:

```tsx
// ✅ Good
jest.mock('@/services/UserService')

// ❌ Bad
jest.mock('../../services/UserService')
```

## Index Files — Public Module Surface

Every feature folder gets an `index.ts` that re-exports its public API:

```ts
// src/features/users/index.ts
export { UserCard } from './components/UserCard'
export { useUserData } from './hooks/useUserData'
export type { User } from './types/user'
export { UserRole } from './enums/user'
```

Other features import from the index, never from internals.
