# Rust Conventions (Agent-Friendly)

## Project Layout

Prefer a deterministic, feature-first module layout:

```
Cargo.toml
src/
  lib.rs                 # public module surface
  main.rs                # binary entrypoint (thin)
  errors.rs
  users/
    mod.rs
    service.rs
    repository.rs
tests/
  users_integration.rs
```

Rules:
- Keep business logic in `lib.rs` modules; keep `main.rs` focused on wiring.
- Group files by domain (`users/`, `orders/`) and split concerns (`service.rs`, `repository.rs`).
- Re-export only stable/public symbols from `lib.rs`.

## Naming

- Modules and files: `snake_case`
- Functions and variables: `snake_case`
- Types, enums, traits: `PascalCase`
- Constants/statics: `SCREAMING_SNAKE_CASE`

## Ownership and Borrowing

- Accept borrowed inputs by default (`&str`, `&[T]`, `&T`) when ownership is not required.
- Return owned data at API boundaries when callers need independent lifetimes.
- Avoid unnecessary `.clone()` calls; clone only when ownership transfer is intentional.

```rust
// ✅ Good — borrow read-only input
fn parse_user_id(raw: &str) -> Result<UserId, ParseUserIdError> {
    UserId::try_from(raw)
}

// ❌ Bad — takes ownership without need
fn parse_user_id(raw: String) -> Result<UserId, ParseUserIdError> {
    UserId::try_from(raw.as_str())
}
```

## Errors

- Return `Result<T, E>` for fallible operations.
- Prefer typed domain errors with `thiserror`.
- At app boundaries (CLI/HTTP), attach context (`anyhow::Context`) before bubbling errors.
- Do not `panic!` in library code for recoverable failures.

```rust
#[derive(thiserror::Error, Debug)]
pub enum UserError {
    #[error("user not found: {0}")]
    NotFound(String),
}
```

## Async and Concurrency

- Use async for I/O boundaries, not for pure CPU transformations.
- In async code, use async-aware primitives (`tokio::sync::Mutex`, channels).
- Track spawned tasks and handle join errors explicitly.
- Apply timeouts/retries at boundaries, not deep inside domain logic.

## Logging and Observability

- Use structured logging/tracing (`tracing` crate).
- Include stable event names and key fields (e.g., `user_id`, `duration_ms`).
- Avoid free-form log strings that are hard to query.

## Testing

- Keep unit tests close to code (`#[cfg(test)] mod tests`).
- Place cross-module behavior tests in `tests/`.
- Prefer deterministic tests; avoid sleeps when synchronization primitives can be used.

## Formatting and Lint

Run these on touched code:

```bash
cargo fmt --all
cargo clippy --all-targets --all-features -- -D warnings
cargo test --all-features
```
