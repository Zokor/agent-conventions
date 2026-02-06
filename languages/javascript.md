# JavaScript Conventions (Agent-Friendly)

## Module System

### Use ES Modules (ESM)

```js
// ✅ Good — ESM
import { createUser } from './services/user.js'
export function UserCard() {}

// ❌ Bad — CommonJS (legacy)
const { createUser } = require('./services/user')
module.exports = { UserCard }
```

### Named exports over default

```js
// ✅ Good — grep-able
export function createUser() {}
export class UserService {}

// ❌ Bad — anonymous to search
export default function() {}
export default class {}
```

## JSDoc Type Annotations

For projects without TypeScript, use JSDoc for type hints:

```js
/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {string} email
 */

/**
 * Creates a new user
 * @param {Object} data
 * @param {string} data.name
 * @param {string} data.email
 * @returns {Promise<User>}
 */
export async function createUser(data) {
  // ...
}
```

### Type imports in JSDoc

```js
/** @type {import('./types').User} */
const user = await fetchUser(id)

/** @param {import('./types').CreateUserData} data */
function createUser(data) {}
```

## Modern Syntax

### Optional chaining

```js
// ✅ Good
const city = user?.address?.city
const first = items?.[0]
const result = callback?.()

// ❌ Bad
const city = user && user.address && user.address.city
```

### Nullish coalescing

```js
// ✅ Good — only null/undefined trigger fallback
const value = input ?? 'default'
const count = data.count ?? 0

// ❌ Bad — 0, '', false also trigger fallback
const value = input || 'default'
```

### Logical assignment operators

```js
// ✅ Good
user.name ??= 'Anonymous'  // assign if null/undefined
config.debug ||= false     // assign if falsy
cache.data &&= transform(cache.data)  // assign if truthy

// ❌ Bad
if (user.name === null || user.name === undefined) {
  user.name = 'Anonymous'
}
```

## Async Patterns

### Prefer async/await over raw promises

```js
// ✅ Good — readable, debuggable
async function fetchUserWithPosts(userId) {
  const user = await fetchUser(userId)
  const posts = await fetchPosts(userId)
  return { user, posts }
}

// ❌ Bad — callback hell
function fetchUserWithPosts(userId) {
  return fetchUser(userId)
    .then(user => fetchPosts(userId)
      .then(posts => ({ user, posts })))
}
```

### Use Promise.all for parallel operations

```js
// ✅ Good — parallel
const [user, posts, comments] = await Promise.all([
  fetchUser(userId),
  fetchPosts(userId),
  fetchComments(userId),
])

// ❌ Bad — sequential when unnecessary
const user = await fetchUser(userId)
const posts = await fetchPosts(userId)
const comments = await fetchComments(userId)
```

### Handle errors explicitly

```js
// ✅ Good — explicit error handling
try {
  const user = await fetchUser(userId)
  return user
} catch (error) {
  if (error instanceof NotFoundError) {
    return null
  }
  throw error
}
```

## Array Methods

### Prefer functional methods over loops

```js
// ✅ Good — declarative
const activeUsers = users.filter(u => u.isActive)
const names = users.map(u => u.name)
const total = items.reduce((sum, item) => sum + item.price, 0)
const admin = users.find(u => u.role === 'admin')
const hasAdmin = users.some(u => u.role === 'admin')
const allActive = users.every(u => u.isActive)

// ❌ Bad — imperative
const activeUsers = []
for (const u of users) {
  if (u.isActive) activeUsers.push(u)
}
```

### Use Array.from for iterables

```js
// ✅ Good
const chars = Array.from(str)
const nodes = Array.from(document.querySelectorAll('.item'))

// Also good for mapping
const doubled = Array.from({ length: 5 }, (_, i) => i * 2)
```

## Object Patterns

### Destructuring

```js
// ✅ Good — clear extraction
const { name, email, role = 'member' } = user
const [first, second, ...rest] = items

// Function parameters
function createUser({ name, email, role = 'member' }) {
  // ...
}
```

### Spread operator

```js
// ✅ Good — immutable updates
const updated = { ...user, name: 'New Name' }
const merged = { ...defaults, ...options }
const combined = [...arr1, ...arr2]
```

### Computed property names

```js
// ✅ Good
const key = 'dynamicKey'
const obj = { [key]: value }
```

## Constants

### Use const objects with clear naming

```js
// ✅ Good — grouped, grep-able
export const UserRole = {
  Admin: 'admin',
  Manager: 'manager',
  Member: 'member',
}

export const HttpStatus = {
  OK: 200,
  Created: 201,
  NotFound: 404,
}

// ❌ Bad — scattered
export const ROLE_ADMIN = 'admin'
export const ROLE_MANAGER = 'manager'
```

### Freeze for true constants

```js
export const UserRole = Object.freeze({
  Admin: 'admin',
  Manager: 'manager',
  Member: 'member',
})
```

## Error Handling

### Create typed errors

```js
export class UserNotFoundError extends Error {
  constructor(userId) {
    super(`User not found: ${userId}`)
    this.name = 'UserNotFoundError'
    this.userId = userId
  }
}

// Usage
throw new UserNotFoundError(userId)
```

## File Organization

Follow the universal concern-bucket pattern:
- `types/user.js` — JSDoc typedefs for user domain
- `enums/user.js` — user-related const objects
- `errors/user.js` — user-related error classes

See [SKILL.md](../SKILL.md) for full file organization rules.
