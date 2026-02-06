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

### Interactive CLI (Recommended)

Select only the languages and frameworks you need:

```bash
npx create-agent-conventions
```

### Shell Script

For environments without Node.js:

```bash
curl -fsSL https://raw.githubusercontent.com/your-org/agent-conventions/main/install.sh | bash
```

### Manual Installation

```bash
git clone https://github.com/your-org/agent-conventions.git ~/.agent-conventions
```

---

## Install Locations

The installer supports multiple AI coding assistants:

| Tool | Install Path | Command |
|------|--------------|---------|
| **Claude Code** | `~/.claude/skills/agent-conventions/` | Default |
| **Codex / ChatGPT** | `~/.codex/skills/agent-conventions/` | `--target codex` |
| **Cursor** | `~/.cursor/skills/agent-conventions/` | `--target cursor` |
| **Generic** | `~/.agents/conventions/` | `--target agents` |
| **Custom** | Any path | `--path /your/path` |

### Examples

```bash
# Interactive - will prompt for target
npx create-agent-conventions

# Direct install to specific tool
npx create-agent-conventions --target claude
npx create-agent-conventions --target codex
npx create-agent-conventions --target cursor

# Custom path
npx create-agent-conventions --path ./my-conventions

# Install all conventions (no prompts)
npx create-agent-conventions --all --target claude
```

---

## Usage

### Claude Code

```bash
# Add skill to session
claude --skill ~/.claude/skills/agent-conventions/SKILL.md

# Or add to .claude/settings.json
{
  "skills": ["~/.claude/skills/agent-conventions/SKILL.md"]
}
```

### Cursor

Add to `.cursor/rules`:
```
@import ~/.cursor/skills/agent-conventions/SKILL.md
```

### Generic

Reference the `SKILL.md` in your AI tool's configuration or system prompt.

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
