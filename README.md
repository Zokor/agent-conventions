# Agent Conventions

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Conventions that make codebases searchable, predictable, and agent-friendly.

> **Core principle**: Agents write the code; conventions write the law.

## Supported Languages & Frameworks

### Languages

| Language | File | Key Topics |
|----------|------|-----------|
| TypeScript | [typescript.md](languages/typescript.md) | Strict mode, generics, utility types, discriminated unions |
| JavaScript | [javascript.md](languages/javascript.md) | ESM, JSDoc, async patterns, modern syntax |
| PHP | [php.md](languages/php.md) | PHP 8.1+, backed enums, readonly, match expressions |
| Python | [python.md](languages/python.md) | Type hints, dataclasses, Pydantic, protocols |
| Java | [java.md](languages/java.md) | Records, sealed classes, Optional, streams |
| C# | [csharp.md](languages/csharp.md) | Nullable refs, records, LINQ, async patterns |
| Go | [go.md](languages/go.md) | Error handling, interfaces, context, packages |
| Rust | [rust.md](languages/rust.md) | Ownership, Result-based errors, cargo fmt/clippy/test |

### Frontend Frameworks

| Framework | File | Key Topics |
|-----------|------|-----------|
| React | [react.md](frameworks/frontend/react.md) | Components, hooks, state management, testing |
| Next.js | [nextjs.md](frameworks/frontend/nextjs.md) | App Router, Server Components, Server Actions |
| Vue | [vue.md](frameworks/frontend/vue.md) | Composition API, composables, Pinia, SFC |
| Angular | [angular.md](frameworks/frontend/angular.md) | Standalone components, signals, services, RxJS |

### Backend Frameworks

| Framework | File | Key Topics |
|-----------|------|-----------|
| Laravel | [laravel.md](frameworks/backend/laravel.md) | Eloquent, controllers, services, Livewire |
| Symfony | [symfony.md](frameworks/backend/symfony.md) | Controllers, services, Doctrine, DTOs |
| Django | [django.md](frameworks/backend/django.md) | Models, services, DRF, selectors |
| Spring Boot | [spring.md](frameworks/backend/spring.md) | Controllers, services, JPA, DTOs |
| NestJS | [nestjs.md](frameworks/backend/nestjs.md) | Modules, services, DTOs, guards |
| Ruby on Rails | [rails.md](frameworks/backend/rails.md) | Models, services, serializers, testing |
| .NET | [dotnet.md](frameworks/backend/dotnet.md) | Minimal APIs, EF Core, Clean Architecture |

### General

| File | Description |
|------|-------------|
| [SKILL.md](SKILL.md) | Universal conventions (file organization, naming, exports, testing, errors, logging) |
| [api.md](api.md) | REST conventions, status codes, response structure |
| [retry.md](retry.md) | Retry policy, error classification, circuit breakers, idempotency |

---

## Installation

Install with `npx skills add` only.

```bash
# Project-local (writes under current repo)
npx -y skills add Zokor/agent-conventions --skill agent-conventions --agent claude-code codex --yes

# Global (writes under home directory)
npx -y skills add Zokor/agent-conventions -g --skill agent-conventions --agent claude-code codex --yes
```

- Project-local install creates `./.agents/skills/agent-conventions` and links `./.claude/skills/agent-conventions`.
- Global install creates `~/.agents/skills/agent-conventions` and links `~/.claude/skills/agent-conventions`.

Useful management commands:

```bash
# List skills exposed by the repo
npx -y skills add Zokor/agent-conventions --list

# List installed skills
npx -y skills list

# List globally installed skills
npx -y skills list -g

# Check and apply skill updates
npx -y skills check && npx -y skills update
```

---

## Usage
Skills are available to supported agents after installation via `npx skills add`.

---

## Versioning

This skill uses semantic versioning tracked in:
- `VERSION` for the current released version
- `CHANGELOG.md` for release notes and upgrade history

Current version: `2.1.1`

---

## Philosophy

Every convention serves one or more of these goals:

| Goal | Description |
|------|-------------|
| **Grep-ability** | Code is easy to find via text search (named exports, consistent naming) |
| **Glob-ability** | File structure is predictable (agents can place files deterministically) |
| **Self-healing** | Conventions prevent drift and regressions automatically |

---

## File Organization Pattern

The conventions support two approaches based on project size:

**Concern-first** (small/medium projects):
```
src/
  components/
    layout/             # Header, Footer, Sidebar
    ui/                 # Button, Modal, Input
    users/              # User-specific components
  services/
  types/
  api/
```

**Feature-first** (large projects):
```
src/
  components/
    layout/             # Shared structural shell
    ui/                 # Shared primitives
  features/
    users/
      components/       # User-specific UI
      services/
      types/
      index.ts          # Public surface
  shared/               # Cross-feature code
```

**Key rule**: One domain concept per file in definition buckets (`types/`, `enums/`, `errors/`). Graduate from concern-first to feature-first when a domain accumulates 3+ concern files.

---

## Contributing

1. Follow the existing file structure
2. Each framework/language file should be self-contained
3. Include practical examples with ✅ Good / ❌ Bad patterns
4. Reference `SKILL.md` for universal rules

---

## License

MIT
