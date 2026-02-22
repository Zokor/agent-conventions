# Browser E2E Testing Conventions (Playwright-first)

## Tool Selection

Use one E2E framework per project unless a migration is in progress.

| Tool | Use When | Avoid When |
|------|----------|------------|
| Playwright (recommended) | New projects, multi-browser coverage, built-in tracing/screenshots, fast parallel CI | Never; this is the default choice for new work |
| Cypress | Repo already uses Cypress and migration is not scheduled | Starting a new project |
| WebdriverIO | Existing enterprise stack already standardizes on it | General frontend app testing where Playwright/Cypress already fit |

Rules:
- New projects: choose Playwright.
- Existing Cypress projects: keep Cypress unless explicitly migrating.
- Do not mix Playwright and Cypress in the same long-lived suite.

## Directory Structure

Keep browser tests at the project root, never colocated with source components.

```text
e2e/
  auth/
    login.spec.ts
  checkout/
    checkout.spec.ts
  fixtures/
    users.json
    products.json
  pages/
    login.page.ts
    checkout.page.ts
  support/
    test-ids.ts
    auth-helpers.ts
playwright.config.ts
```

Allowed alternate root:
- `tests/e2e/` (if the repo already uses a global `tests/` tree)

## Naming Conventions

- Spec files: `<feature-or-flow>.spec.ts`
  Example: `login.spec.ts`, `checkout.spec.ts`, `profile-edit.spec.ts`
- One spec file per user flow, not per UI component.
- Test descriptions should be grep-friendly:
  Example: `auth.login: valid credentials redirect to dashboard`
- Page Object Model files: `<flow>.page.ts`
- POM classes: PascalCase + `Page` suffix
  Example: `LoginPage`, `CheckoutPage`

## Selector Strategy

Use `data-testid` selectors as the stable contract between UI and tests.

Rules:
- Always select with `data-testid`.
- Never rely on CSS classes, tag names, DOM position, or visible text alone.
- Add test IDs during feature implementation, not as a retrofit.

Examples:

```tsx
// React
<button data-testid="auth-login-submit">Log in</button>
```

```vue
<!-- Vue -->
<button data-testid="auth-login-submit">Log in</button>
```

```html
<!-- Angular template -->
<button data-testid="auth-login-submit">Log in</button>
```

```ts
await page.getByTestId('auth-login-submit').click()
```

## Test Structure

Use Arrange / Act / Assert in every test and keep each `test()` focused on one user flow.

```ts
import { test, expect } from '@playwright/test'

test('auth.login: valid credentials redirect to dashboard', async ({ page }) => {
  // Arrange
  await page.goto('/login')
  await page.getByTestId('auth-login-email').fill('alice@example.com')
  await page.getByTestId('auth-login-password').fill('correct-horse-battery-staple')

  // Act
  await page.getByTestId('auth-login-submit').click()

  // Assert
  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByTestId('dashboard-header')).toBeVisible()
})
```

Rules:
- Keep assertions inside the same test that executes the flow.
- Prefer explicit expectations over manual `waitForTimeout`.
- Use `beforeEach` only for shared setup that is truly common.

## API Mocking

Prefer real API calls for critical integration paths. Mock only when isolation is required.

Playwright route interception:

```ts
await page.route('**/api/users/me', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ id: 'u1', name: 'Alice' }),
  })
})
```

Guidelines:
- Mock unstable third-party dependencies and rare failure paths.
- Keep fixtures under `e2e/fixtures/`.
- If the repo uses MSW for unit/component tests, reuse the same handler payloads where possible and mirror behavior with `page.route()`.

## CI Configuration

Run browser tests as deterministic CI checks, not optional smoke scripts.

Required defaults:
- Headless mode in CI.
- Upload screenshots, videos, and traces on failure.
- Enable retries in CI only (example: `retries: 1`).
- Parallelize with a fixed worker count based on CI CPU.

Playwright config baseline:

```ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  retries: process.env.CI ? 1 : 0,
  use: {
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
})
```

## Agent-Friendly Patterns

- Keep test names grep-able and flow-scoped (`feature.action: outcome`).
- Keep folder shapes glob-able (`e2e/<domain>/<flow>.spec.ts`).
- Centralize repeated test IDs in `e2e/support/test-ids.ts` when reused widely.
- Avoid magic strings for routes, IDs, and credentials; use shared constants/fixtures.
- Prefer deterministic helpers over hidden globals or side-effect-heavy hooks.

