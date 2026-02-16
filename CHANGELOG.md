# Changelog

All notable changes to this skill are documented in this file.

## [2.1.0] - 2026-02-16

### Added
- Added retry & error recovery conventions as `retry.md` (renamed from `plan.md`).
- New sections: circuit breaker, retry budgets, distributed retry concerns, queue/async retry.
- Cross-references to `retry.md` in `SKILL.md` and `README.md`.

### Changed
- Fixed 409 Conflict classification: non-retryable by default, retryable only for transient conflicts (optimistic lock/ETag).
- Specified backoff formula precisely: `n` starts at 0, `max_backoff = 30s`, `max_total_retry_time = 60s`.
- Strengthened `Retry-After` handling: parse both seconds and HTTP-date, cap at 60s, takes precedence over calculated backoff.
- Expanded test expectations: Retry-After precedence, timeout increase, backoff bounds, total deadline, 409 classification.

### Removed
- Removed generic `plan.md` filename (replaced by `retry.md`).

## [2.0.0] - 2026-02-16

### Added
- Added Rust conventions in `languages/rust.md`.
- Added version tracking files: `VERSION` and `CHANGELOG.md`.

### Changed
- Standardized installation to `npx skills add Zokor/agent-conventions`.
- Documented explicit project-local and global install behavior for `.agents` and `.claude`.

### Removed
- Removed legacy shell installer `install.sh`.
- Removed legacy npm CLI package under `packages/cli/`.
