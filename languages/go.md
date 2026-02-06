# Go Conventions (Agent-Friendly)

## Project Layout

Prefer a standard, glob-able structure:

```
cmd/
  myapp/                 # main package(s)
internal/
  users/                 # domain/feature packages
    handler.go
    service.go
    repo.go
    types.go
    errors.go
pkg/                     # optional: reusable libraries (only if needed)
```

Rules:
- Keep most code under `internal/` (prevents accidental public APIs).
- Organize by **domain/feature package** first (`internal/users`, `internal/orders`).
- Split files by concern (`handler.go`, `service.go`, `repo.go`) to keep files small and searchable.

## Naming

- Packages: short, `lowercase` (no underscores unless unavoidable)
- Files: `lower_snake_case.go` when needed (common: `user_service.go`)
- Exported identifiers: `PascalCase`

## Context

- First parameter on request-scoped functions: `ctx context.Context`
- Never store contexts in structs.

## Errors

- Wrap errors with `%w` so callers can use `errors.Is/As`.
- Prefer sentinel errors for coarse categories; typed errors when you need structured fields.

```go
var ErrUserNotFound = errors.New("user not found")
```

## Interfaces

- Define interfaces at the consumer side (“accept interfaces, return structs”).
- Keep interfaces small (1–3 methods).

## Logging

Use the repo’s logger; prefer structured logs:
- event name: `user.created`
- fields: `user_id`, `duration_ms`, etc

## Testing

- Colocate tests as `*_test.go` in the same package.
- Prefer table-driven tests.
- Avoid asserting on unexported internals unless necessary.

## Formatting / Lint

- Always run `gofmt` on changed files.
- If present, run `golangci-lint` and fix issues in touched code.

