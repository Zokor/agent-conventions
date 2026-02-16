# Agent Conventions

[![npm version](https://img.shields.io/npm/v/create-agent-conventions.svg)](https://www.npmjs.com/package/create-agent-conventions)
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

---

## Installation

### Vercel-Style Installer (Recommended)

```bash
npx skills add Zokor/agent-conventions
```

Install globally across detected agents:

```bash
npx skills add Zokor/agent-conventions -g --agent '*' -y
```

Useful management commands:

```bash
# List skills exposed by the repo
npx skills add Zokor/agent-conventions --list

# List installed skills
npx skills list

# Check and apply skill updates
npx skills check && npx skills update
```

### Deprecated Installation Methods

These are temporarily kept for compatibility and will be removed in a future cleanup:

```bash
# Deprecated: legacy npm CLI
npx create-agent-conventions

# Deprecated: legacy shell installer
curl -fsSL https://raw.githubusercontent.com/Zokor/agent-conventions/main/install.sh | bash

# Deprecated: manual clone workflow
git clone https://github.com/Zokor/agent-conventions.git ~/.agent-conventions
```

---

## Usage
Skills are available to supported agents after installation via `npx skills add`.

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
