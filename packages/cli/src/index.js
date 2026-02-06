#!/usr/bin/env node

import prompts from 'prompts'
import pc from 'picocolors'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const REPO_URL = 'https://raw.githubusercontent.com/your-org/agent-conventions/main'

// Parse CLI arguments
const args = process.argv.slice(2)
const flags = {
  target: getFlag('--target', '-t'),
  path: getFlag('--path', '-p'),
  all: args.includes('--all') || args.includes('-a'),
  help: args.includes('--help') || args.includes('-h'),
}

function getFlag(long, short) {
  const idx = args.findIndex(a => a === long || a === short)
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null
}

// Install targets
const TARGETS = {
  claude: { path: '~/.claude/skills/agent-conventions', name: 'Claude Code' },
  codex: { path: '~/.codex/skills/agent-conventions', name: 'Codex / ChatGPT' },
  cursor: { path: '~/.cursor/skills/agent-conventions', name: 'Cursor' },
  agents: { path: '~/.agents/conventions', name: 'Generic Agents' },
}

const OPTIONS = {
  languages: [
    { value: 'typescript', title: 'TypeScript', description: 'Strict mode, generics, utility types' },
    { value: 'javascript', title: 'JavaScript', description: 'ESM, JSDoc, modern syntax' },
    { value: 'php', title: 'PHP', description: 'PHP 8.1+, backed enums, readonly' },
    { value: 'python', title: 'Python', description: 'Type hints, dataclasses, protocols' },
    { value: 'java', title: 'Java', description: 'Records, sealed classes, streams' },
    { value: 'csharp', title: 'C#', description: 'Nullable refs, records, LINQ' },
    { value: 'go', title: 'Go', description: 'Error handling, interfaces, context' },
  ],
  frontendFrameworks: [
    { value: 'react', title: 'React', description: 'Components, hooks, state' },
    { value: 'nextjs', title: 'Next.js', description: 'App Router, Server Components' },
    { value: 'vue', title: 'Vue', description: 'Composition API, Pinia' },
    { value: 'angular', title: 'Angular', description: 'Standalone, signals, RxJS' },
  ],
  backendFrameworks: [
    { value: 'laravel', title: 'Laravel', description: 'PHP, Eloquent, Livewire' },
    { value: 'symfony', title: 'Symfony', description: 'PHP, Doctrine, Messenger' },
    { value: 'django', title: 'Django', description: 'Python, DRF, ORM' },
    { value: 'spring', title: 'Spring Boot', description: 'Java, JPA, annotations' },
    { value: 'nestjs', title: 'NestJS', description: 'TypeScript, decorators, DI' },
    { value: 'rails', title: 'Ruby on Rails', description: 'Ruby, ActiveRecord, services' },
    { value: 'dotnet', title: '.NET', description: 'C#, EF Core, Minimal APIs' },
  ],
}

const FILE_PATHS = {
  // Core
  core: 'SKILL.md',
  api: 'api.md',
  // Languages
  typescript: 'languages/typescript.md',
  javascript: 'languages/javascript.md',
  php: 'languages/php.md',
  python: 'languages/python.md',
  java: 'languages/java.md',
  csharp: 'languages/csharp.md',
  go: 'languages/go.md',
  // Frontend
  react: 'frameworks/frontend/react.md',
  nextjs: 'frameworks/frontend/nextjs.md',
  vue: 'frameworks/frontend/vue.md',
  angular: 'frameworks/frontend/angular.md',
  // Backend
  laravel: 'frameworks/backend/laravel.md',
  symfony: 'frameworks/backend/symfony.md',
  django: 'frameworks/backend/django.md',
  spring: 'frameworks/backend/spring.md',
  nestjs: 'frameworks/backend/nestjs.md',
  rails: 'frameworks/backend/rails.md',
  dotnet: 'frameworks/backend/dotnet.md',
}

function showHelp() {
  console.log(`
${pc.bold(pc.cyan('create-agent-conventions'))} - Install agent-friendly code conventions

${pc.bold('Usage:')}
  npx create-agent-conventions [options]

${pc.bold('Options:')}
  -t, --target <target>   Install target (claude, codex, cursor, agents)
  -p, --path <path>       Custom install path
  -a, --all               Install all conventions (skip prompts)
  -h, --help              Show this help message

${pc.bold('Targets:')}
  claude      ~/.claude/skills/agent-conventions/     (default)
  codex       ~/.codex/skills/agent-conventions/
  cursor      ~/.cursor/skills/agent-conventions/
  agents      ~/.agents/conventions/

${pc.bold('Examples:')}
  npx create-agent-conventions                    # Interactive mode
  npx create-agent-conventions --target cursor    # Install to Cursor
  npx create-agent-conventions --all --target claude  # Install everything to Claude
  npx create-agent-conventions --path ./my-rules  # Custom path
`)
}

function expandPath(p) {
  return p.replace(/^~/, process.env.HOME)
}

async function main() {
  if (flags.help) {
    showHelp()
    process.exit(0)
  }

  console.log('')
  console.log(pc.bold(pc.cyan('🤖 Agent Conventions Installer')))
  console.log(pc.dim('Conventions that make codebases agent-friendly\n'))

  let selections = {
    languages: [],
    frontendFrameworks: [],
    backendFrameworks: [],
    includeApi: true,
    target: flags.target || null,
    customPath: flags.path || null,
  }

  // If --all flag, select everything
  if (flags.all) {
    selections.languages = OPTIONS.languages.map(o => o.value)
    selections.frontendFrameworks = OPTIONS.frontendFrameworks.map(o => o.value)
    selections.backendFrameworks = OPTIONS.backendFrameworks.map(o => o.value)
  } else {
    // Interactive prompts
    const response = await prompts([
      {
        type: 'multiselect',
        name: 'languages',
        message: 'Which languages do you use?',
        choices: OPTIONS.languages,
        hint: '- Space to select, Enter to confirm',
        instructions: false,
      },
      {
        type: 'multiselect',
        name: 'frontendFrameworks',
        message: 'Which frontend frameworks?',
        choices: OPTIONS.frontendFrameworks,
        hint: '- Space to select, Enter to confirm',
        instructions: false,
      },
      {
        type: 'multiselect',
        name: 'backendFrameworks',
        message: 'Which backend frameworks?',
        choices: OPTIONS.backendFrameworks,
        hint: '- Space to select, Enter to confirm',
        instructions: false,
      },
      {
        type: 'toggle',
        name: 'includeApi',
        message: 'Include API/HTTP conventions?',
        initial: true,
        active: 'yes',
        inactive: 'no',
      },
    ], {
      onCancel: () => {
        console.log(pc.yellow('\nInstallation cancelled.'))
        process.exit(0)
      }
    })

    Object.assign(selections, response)
  }

  // Determine install path
  let installPath

  if (selections.customPath) {
    installPath = expandPath(selections.customPath)
  } else if (selections.target && TARGETS[selections.target]) {
    installPath = expandPath(TARGETS[selections.target].path)
  } else {
    // Prompt for target
    const targetResponse = await prompts({
      type: 'select',
      name: 'target',
      message: 'Where to install?',
      choices: [
        ...Object.entries(TARGETS).map(([key, val]) => ({
          title: val.name,
          value: key,
          description: val.path,
        })),
        { title: 'Custom path', value: 'custom' },
      ],
    }, {
      onCancel: () => {
        console.log(pc.yellow('\nInstallation cancelled.'))
        process.exit(0)
      }
    })

    if (targetResponse.target === 'custom') {
      const customResponse = await prompts({
        type: 'text',
        name: 'path',
        message: 'Enter custom path:',
      })
      installPath = expandPath(customResponse.path)
    } else {
      installPath = expandPath(TARGETS[targetResponse.target].path)
    }
  }

  // Collect files to install
  const filesToInstall = ['core'] // Always include SKILL.md

  if (selections.includeApi) {
    filesToInstall.push('api')
  }

  filesToInstall.push(
    ...selections.languages,
    ...selections.frontendFrameworks,
    ...selections.backendFrameworks
  )

  if (filesToInstall.length === 1 && !flags.all) {
    console.log(pc.yellow('\nNo conventions selected. Installing core only.'))
  }

  console.log('')
  console.log(pc.dim(`Installing to: ${installPath}`))
  console.log('')

  // Create directories
  await fs.mkdir(installPath, { recursive: true })
  await fs.mkdir(path.join(installPath, 'languages'), { recursive: true })
  await fs.mkdir(path.join(installPath, 'frameworks', 'frontend'), { recursive: true })
  await fs.mkdir(path.join(installPath, 'frameworks', 'backend'), { recursive: true })

  // Download/copy files
  let installed = 0
  for (const key of filesToInstall) {
    const filePath = FILE_PATHS[key]
    if (!filePath) continue

    try {
      const destPath = path.join(installPath, filePath)
      const content = await fetchFile(filePath)

      await fs.mkdir(path.dirname(destPath), { recursive: true })
      await fs.writeFile(destPath, content)

      console.log(pc.green('✓'), pc.dim(filePath))
      installed++
    } catch (error) {
      console.log(pc.red('✗'), pc.dim(filePath), pc.red(`(${error.message})`))
    }
  }

  // Generate customized SKILL.md with only selected references
  await generateSkillFile(installPath, selections)

  console.log('')
  console.log(pc.green(pc.bold(`✓ Installed ${installed} convention files`)))
  console.log('')
  console.log(pc.dim('Usage instructions:'))
  console.log(pc.cyan(`  Add to your AI tool's config: ${installPath}/SKILL.md`))
  console.log('')
}

async function fetchFile(filePath) {
  // First try local templates
  const localPath = path.join(__dirname, '..', 'templates', filePath)
  try {
    return await fs.readFile(localPath, 'utf-8')
  } catch {
    // Fall back to fetching from GitHub
    const url = `${REPO_URL}/${filePath}`
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    return response.text()
  }
}

async function generateSkillFile(installPath, selections) {
  const frontendRefs = selections.frontendFrameworks
    .map(f => `- **${OPTIONS.frontendFrameworks.find(o => o.value === f)?.title}**: See [frameworks/frontend/${f}.md](frameworks/frontend/${f}.md)`)
    .join('\n')

  const backendRefs = selections.backendFrameworks
    .map(f => `- **${OPTIONS.backendFrameworks.find(o => o.value === f)?.title}**: See [frameworks/backend/${f}.md](frameworks/backend/${f}.md)`)
    .join('\n')

  const languageRefs = selections.languages
    .map(l => `- **${OPTIONS.languages.find(o => o.value === l)?.title}**: See [languages/${l}.md](languages/${l}.md)`)
    .join('\n')

  // Read the base SKILL.md and update references section
  let skillContent = await fetchFile('SKILL.md')

  // Replace the Stack-Specific References section
  const refSection = `## Stack-Specific References

For detailed conventions per framework or language, read the relevant reference file:

${frontendRefs ? `### Frontend Frameworks\n${frontendRefs}\n\n` : ''}${backendRefs ? `### Backend Frameworks\n${backendRefs}\n\n` : ''}${languageRefs ? `### Languages\n${languageRefs}\n\n` : ''}${selections.includeApi ? `### General\n- **API / HTTP**: See [api.md](api.md)\n\n` : ''}Read the appropriate reference file based on the project's stack before generating code.`

  // Replace from "## Stack-Specific References" to "## Self-Healing"
  skillContent = skillContent.replace(
    /## Stack-Specific References[\s\S]*?(?=## Self-Healing)/,
    refSection + '\n\n'
  )

  await fs.writeFile(path.join(installPath, 'SKILL.md'), skillContent)
}

main().catch(console.error)
