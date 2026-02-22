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
    routes.ts
    auth-setup.ts
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

### Rules
- Always select with `data-testid`.
- Never rely on CSS classes, tag names, DOM position, or visible text alone.
- Add test IDs during feature implementation, not as a retrofit.

### Naming Convention

Use kebab-case with a `<domain>-<context>-<element>` pattern (two or three segments):

```
auth-login-email          # domain-context-element
auth-login-password
auth-login-submit
dashboard-header          # domain-element (when context = page itself)
checkout-cart-item
checkout-place-order
```

Minimum two segments (`domain-element`), three when the domain has multiple contexts. This ensures IDs are globally unique, grep-friendly, and self-documenting.

### Examples

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

### Centralizing Test IDs

When test IDs are reused across multiple spec files, centralize them in `e2e/support/test-ids.ts`:

```ts
// e2e/support/test-ids.ts
export const TID = {
  auth: {
    loginEmail: 'auth-login-email',
    loginPassword: 'auth-login-password',
    loginSubmit: 'auth-login-submit',
  },
  dashboard: {
    header: 'dashboard-header',
  },
  checkout: {
    cartItem: 'checkout-cart-item',
    placeOrder: 'checkout-place-order',
  },
} as const
```

```ts
// usage in specs
import { TID } from '../support/test-ids'

await page.getByTestId(TID.auth.loginSubmit).click()
```

This keeps IDs in sync between source components and test code.

## Test Structure

Use Arrange / Act / Assert in every test and keep each `test()` focused on one user flow.

```ts
import { test, expect } from '@playwright/test'
import { TID } from '../support/test-ids'
import { ROUTES } from '../support/routes'
import users from '../fixtures/users.json'

test('auth.login: valid credentials redirect to dashboard', async ({ page }) => {
  // Arrange
  await page.goto(ROUTES.login)
  await page.getByTestId(TID.auth.loginEmail).fill(users.valid.email)
  await page.getByTestId(TID.auth.loginPassword).fill(users.valid.password)

  // Act
  await page.getByTestId(TID.auth.loginSubmit).click()

  // Assert
  await expect(page).toHaveURL(ROUTES.dashboardPattern)
  await expect(page.getByTestId(TID.dashboard.header)).toBeVisible()
})
```

Supporting files:

```ts
// e2e/support/routes.ts
export const ROUTES = {
  login: '/login',
  dashboard: '/dashboard',
  dashboardPattern: /\/dashboard$/,
} as const
```

```json
// e2e/fixtures/users.json
{
  "valid": { "id": "u1", "email": "alice@example.com", "password": "correct-horse-battery-staple" },
  "invalid": { "id": "u2", "email": "bob@example.com", "password": "wrong" }
}
```

Rules:
- Keep assertions inside the same test that executes the flow.
- Prefer explicit expectations over manual `waitForTimeout`.
- Use `beforeEach` only for shared setup that is truly common.
- No magic strings — routes, test IDs, and credentials live in `support/` or `fixtures/`.

## Authentication State Reuse

Avoid re-logging-in for every spec. Use Playwright's `storageState` to authenticate once in global setup and share the session.

### Global setup

```ts
// e2e/support/auth-setup.ts
import { chromium } from '@playwright/test'
import { TID } from './test-ids'
import { ROUTES } from './routes'
import users from '../fixtures/users.json'

async function globalSetup() {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  await page.goto(ROUTES.login)
  await page.getByTestId(TID.auth.loginEmail).fill(users.valid.email)
  await page.getByTestId(TID.auth.loginPassword).fill(users.valid.password)
  await page.getByTestId(TID.auth.loginSubmit).click()
  await page.waitForURL(ROUTES.dashboardPattern)

  await page.context().storageState({ path: 'e2e/.auth/state.json' }) // adjust path to match testDir
  await browser.close()
}

export default globalSetup
```

### Config integration

```ts
// playwright.config.ts (relevant additions)
export default defineConfig({
  globalSetup: './e2e/support/auth-setup.ts', // adjust path to match testDir
  use: {
    storageState: 'e2e/.auth/state.json',    // adjust path to match testDir
  },
})
```

### Unauthenticated tests

For specs that test login itself or anonymous flows, override the storage state:

```ts
test.use({ storageState: { cookies: [], origins: [] } })

test('auth.login: shows error on invalid credentials', async ({ page }) => {
  // ...
})
```

Add the auth state directory to `.gitignore` (e.g., `e2e/.auth/` or `tests/e2e/.auth/`).

## API Mocking

Prefer real API calls against controlled test environments (seeded databases, test accounts). Mock only when isolation is required.

Playwright route interception:

```ts
import users from '../fixtures/users.json'

await page.route('**/api/users/me', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ id: users.valid.id, name: 'Alice' }),
  })
})
```

Guidelines:
- Mock unstable third-party dependencies and rare failure paths.
- In CI, mock external/third-party APIs for determinism; use real calls only against controlled test databases or seeded environments.
- Keep fixture data under `e2e/fixtures/`.
- If the repo uses MSW for unit/component tests, reuse the same handler payloads where possible and mirror behavior with `page.route()`.

## CI Configuration

Run browser tests as deterministic CI checks, not optional smoke scripts.

Required defaults:
- Headless mode in CI (headed locally for debugging).
- Upload screenshots, videos, and traces on failure.
- Enable retries in CI only (example: `retries: 1`).
- Parallelize with a fixed worker count based on CI CPU.

Playwright config baseline:

```ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',                          // or './tests/e2e' if the repo uses a global tests/ tree
  globalSetup: './e2e/support/auth-setup.ts', // adjust path to match testDir
  retries: process.env.CI ? 1 : 0,
  use: {
    headless: !!process.env.CI,
    storageState: 'e2e/.auth/state.json',    // adjust path to match testDir
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
})
```

## Agent-Friendly Patterns

- Keep test names grep-able and flow-scoped (`feature.action: outcome`).
- Keep folder shapes glob-able (`e2e/<domain>/<flow>.spec.ts`).
- Centralize repeated test IDs in `e2e/support/test-ids.ts` (see [Centralizing Test IDs](#centralizing-test-ids)).
- No magic strings — routes, test IDs, and credentials live in `support/` or `fixtures/`.
- Prefer deterministic helpers over hidden globals or side-effect-heavy hooks.
