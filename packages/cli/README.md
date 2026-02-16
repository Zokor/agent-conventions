# create-agent-conventions

Interactive CLI to install agent-friendly code conventions for AI coding assistants.

## Status

Deprecated. Use:

```bash
npx skills add Zokor/agent-conventions
```

Recommended global install:

```bash
npx skills add Zokor/agent-conventions -g --agent '*' -y
```

## Usage

```bash
npx create-agent-conventions
```

## What it does

1. Prompts you to select languages (TypeScript, Python, Go, etc.)
2. Prompts you to select frontend frameworks (React, Vue, Angular, Next.js)
3. Prompts you to select backend frameworks (Laravel, Django, Spring, etc.)
4. Asks where to install (Claude, Codex, Cursor, or custom path)
5. Downloads only the selected convention files
6. Generates a customized `SKILL.md` with only your selected references

## Install Targets

| Target | Path | Supported By |
|--------|------|--------------|
| `claude` | `~/.claude/skills/agent-conventions/` | Claude Code |
| `codex` | `~/.codex/skills/agent-conventions/` | Codex / ChatGPT |
| `cursor` | `~/.cursor/skills/agent-conventions/` | Cursor |
| `agents` | `~/.agents/conventions/` | Codex, Cursor (universal) |

Use `--target agents` for a universal location that works with both Codex and Cursor.

## Options

```bash
npx create-agent-conventions --target claude    # Install for Claude Code
npx create-agent-conventions --target agents    # Universal (Codex + Cursor)
npx create-agent-conventions --path ./my-rules  # Custom path
npx create-agent-conventions --all              # Install all conventions
```

## After Installation

### Claude Code

```bash
claude --skill ~/.claude/skills/agent-conventions/SKILL.md
```

Or add to `.claude/settings.json`:

```json
{
  "skills": ["~/.claude/skills/agent-conventions/SKILL.md"]
}
```

### Cursor

Add to `.cursor/rules`:

```
@import ~/.agents/conventions/SKILL.md
```

### Codex / ChatGPT

Reference the skill in your Codex configuration:

```
~/.agents/conventions/SKILL.md
```

## Development

```bash
cd packages/cli
npm install
npm start
```
