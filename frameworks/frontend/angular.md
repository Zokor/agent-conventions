# Angular Conventions (Standalone-first)

## File Organization

Choose the approach that fits your project size (see [SKILL.md](../../SKILL.md) for full guidance).

### Concern-first (small/medium projects)

```
src/app/
  core/                       # singletons: auth, http, interceptors, config
    http/
      auth.interceptor.ts
    errors/
      error-handler.ts
  components/
    layout/
      header/
        header.component.ts
        header.component.html
      sidebar/
        sidebar.component.ts
        sidebar.component.html
    ui/
      button/
        button.component.ts
    users/
      user-card/
        user-card.component.ts
        user-card.component.html
        user-card.component.spec.ts
  services/
    user.service.ts
    user.service.spec.ts
  types/
    user.ts
  enums/
    user.ts
```

### Feature-first (large projects)

```
src/app/
  core/                       # singletons: auth, http, interceptors, config
    http/
      auth.interceptor.ts
    errors/
      error-handler.ts
  components/
    layout/
      header/
        header.component.ts
        header.component.html
      sidebar/
        sidebar.component.ts
        sidebar.component.html
    ui/
      button/
        button.component.ts
  shared/                     # reusable cross-feature helpers
    pipes/
    directives/
    types/
      pagination.ts
    enums/
      http.ts
  features/
    users/
      components/
        user-card/
          user-card.component.ts
          user-card.component.html
          user-card.component.scss
          user-card.component.spec.ts
      services/
        user.service.ts
        user.service.spec.ts
      api/
        user.api.ts
      types/
        user.ts
      enums/
        user.ts
      errors/
        user.ts
      routes.ts
```

Rules:
- Features import from `shared/`, `components/`, and their own feature folder only.
- `core/` is "root-only" (features can depend on it; `core/` must not depend on features).
- Shared UI (layout, primitives) always lives in `components/layout/` and `components/ui/`.
- Prefer **one domain concept per file** inside `types/`, `enums/`, `errors/` (example: `types/user.ts`).

## Components

### Standalone-first

- Prefer standalone components/directives/pipes unless the codebase is module-heavy already.
- Keep `imports: [...]` explicit and minimal for grep-ability.

### Prefer signals for local state

- Use signals for local UI state.
- For async streams, prefer `AsyncPipe` or convert with `toSignal()` (avoid manual `subscribe()` in components).

## Services / API

Rules:
- No `HttpClient` calls in components.
- Put endpoint calls in `api/*.ts`; keep orchestration in `services/*.ts`.

```ts
// features/users/api/user.api.ts
export class UserApi {
  constructor(private readonly http: HttpClient) {}

  fetchUser(userId: string) {
    return this.http.get<User>(`/api/users/${userId}`)
  }
}
```

If a service is feature-specific, provide it at the route/feature boundary (route-level providers) rather than `providedIn: 'root'`.

## Errors

Prefer typed errors over stringly-typed branching:
- Domain/validation errors live in `features/<feature>/errors/`
- Boundary mapping lives in `core/errors/` (HTTP → typed error → UI)

## Testing

- Keep unit tests colocated as `*.spec.ts` (Angular convention), unless the repo standard differs.
- Prefer testing behavior (DOM + interactions) over implementation details.
- Mock HTTP with `HttpTestingController` (or repo standard).

