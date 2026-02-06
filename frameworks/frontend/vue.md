# Vue 3 Conventions (Composition API)

## File Organization

Choose the approach that fits your project size (see [SKILL.md](../../SKILL.md) for full guidance).

### Concern-first (small/medium projects)

```
src/
  components/
    layout/
      AppHeader.vue           ← structural shell
      AppFooter.vue
      AppSidebar.vue
    ui/
      BaseButton.vue          ← shared primitives
      BaseModal.vue
    users/
      UserCard.vue
      UserCard.test.ts
  composables/
    useUserData.ts
  stores/
    auth.store.ts
  api/
    users.api.ts
  types/
    user.ts
  enums/
    user.ts
```

### Feature-first (large projects)

```
src/
  components/
    layout/
      AppHeader.vue           ← structural shell
      AppFooter.vue
      AppSidebar.vue
    ui/
      BaseButton.vue          ← shared primitives
      BaseModal.vue
  features/
    users/
      components/
        UserCard.vue
        UserCard.test.ts
      composables/
        useUserData.ts
        useUserData.test.ts
      stores/
        user.store.ts
      api/
        user.api.ts
      types/
        user.ts
      enums/
        user.ts
      errors/
        user.ts
      index.ts
  shared/
    composables/
    types/
    enums/
    utils/
```

Rules:
- Keep each `features/<feature>/` folder **self-contained** (no deep imports into another feature's internals).
- Put cross-feature code in `shared/` (concern-first) or top-level concern folders (feature-first).
- Shared UI (layout, primitives) always lives in `src/components/layout/` and `src/components/ui/`.
- Prefer **one domain concept per file** inside `types/`, `enums/`, `errors/`, etc (example: `types/user.ts`).

## Components (SFC)

### Default to `<script setup lang="ts">`

```vue
<script setup lang="ts">
defineOptions({ name: 'UserCard' })

type Props = { user: User }
const props = defineProps<Props>()
</script>

<template>
  <div>{{ props.user.name }}</div>
</template>
```

Rules:
- Set a component name (`defineOptions({ name: 'X' })`) so logs/errors/devtools are searchable.
- Keep templates free of “smart” logic; push logic into `composables/` or `services/`.
- Prefer `@/` path aliases (avoid `../../../`).

### Keep UI strings out of templates

Use i18n keys or constants:
- `t('actions.save')`
- `LABELS.save`

## Composables

File rules:
- Name composables `useX.ts`, one composable per file.
- Return a stable, explicit API (avoid leaking reactive internals unnecessarily).

```ts
// features/users/composables/useUserData.ts
export function useUserData(userId: string) {
  // fetch/derive state here
  return { /* state */, /* actions */ }
}
```

## Stores (Pinia)

Keep stores as orchestration/state; keep heavy business logic in `services/`.

```
features/users/stores/user.store.ts
features/users/services/UserService.ts
```

## API / Services

Rules:
- No `fetch()`/`axios` calls directly inside components.
- Keep endpoint calls in `api/*.ts` and map responses to local types in one place.

```ts
// features/users/api/user.api.ts
export async function fetchUser(userId: string): Promise<User> {
  // boundary: validate/shape response here if the project uses runtime validation
}
```

## Testing

Recommended tools (when available in the codebase):
- Component tests: `@vue/test-utils`
- Unit tests: Vitest/Jest (follow repo standard)
- API mocking: MSW (prefer over ad-hoc fetch mocks)

Test placement:
- If the repo colocates: `UserCard.test.ts` next to `UserCard.vue`
- If the repo uses `tests/`: mirror `src/` paths under `tests/`

