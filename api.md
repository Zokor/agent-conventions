# API / HTTP Conventions

## API Design

### Route naming — resource-based, predictable

```
GET    /api/users          → index (list)
POST   /api/users          → store (create)
GET    /api/users/{id}     → show (read)
PUT    /api/users/{id}     → update (full replace)
PATCH  /api/users/{id}     → update (partial)
DELETE /api/users/{id}     → destroy (delete)
```

### Response structure — consistent envelope

```json
{
  "data": { ... },
  "meta": { "page": 1, "total": 42 },
  "errors": []
}
```

Always return consistent shapes. Agents and clients rely on predictable structures.

### Status codes — use the right one

| Code | When |
|------|------|
| 200 | Success (with body) |
| 201 | Created |
| 204 | Success (no body, e.g., delete) |
| 400 | Bad request / validation error |
| 401 | Unauthenticated |
| 403 | Unauthorized (forbidden) |
| 404 | Not found |
| 422 | Validation failed (Laravel convention) |
| 500 | Server error (never intentional) |

## Middleware — Always Present on Routes

Every route handler must go through appropriate middleware:
- **Authentication** — verify identity
- **Authorization** — verify permissions
- **Validation** — validate input schema
- **Rate limiting** — prevent abuse
- **Logging/tracing** — observability

```
// ✅ Good — middleware stack explicit
Route::middleware(['auth', 'verified', 'throttle:api'])->group(function () {
    Route::apiResource('users', UserController::class);
});

// ❌ Bad — unprotected route
Route::post('/users', [UserController::class, 'store']);
```

## Database Patterns

### Never use string interpolation in queries

```php
// ✅ Good — parameterized
User::where('email', $email)->first();
DB::select('SELECT * FROM users WHERE id = ?', [$id]);

// ❌ Bad — SQL injection vector
DB::select("SELECT * FROM users WHERE id = {$id}");
```

### Migrations are the source of truth

- One migration per change
- Never edit deployed migrations — create a new one
- Include rollback (`down()`) methods
- Name migrations descriptively: `create_users_table`, `add_role_to_users_table`

### Index strategy

Index columns used in:
- `WHERE` clauses
- `ORDER BY` clauses
- `JOIN` conditions
- Unique constraints

Don't over-index — each index slows writes.

## Error Handling Strategy

### Layer-specific error handling:

```
Controller/Route → catches domain exceptions → returns HTTP response
Service/Action   → catches infra exceptions → throws domain exceptions
Repository/DB    → raw exceptions bubble up to service layer
```

### Error taxonomy:

```
AppException (base)
├── ValidationException     → 422
├── AuthenticationException → 401
├── AuthorizationException  → 403
├── NotFoundException       → 404
│   ├── UserNotFoundException
│   └── OrderNotFoundException
├── ConflictException       → 409
└── ExternalServiceException → 502
```

## Logging Standards

### Log levels — use correctly:

| Level | When |
|-------|------|
| `debug` | Development-only detail |
| `info` | Business events (user.created, order.placed) |
| `warning` | Recoverable issues (retry, fallback used) |
| `error` | Failures requiring attention |
| `critical` | System-level failures |

### Always include context:

```
logger.info('order.completed', {
  orderId: order.id,
  userId: order.userId,
  total: order.total,
  duration_ms: elapsed
})
```

### Never log sensitive data:

- No passwords, tokens, or API keys
- No full credit card numbers
- No PII in plain text (mask or hash)

## Environment & Configuration

- All secrets in environment variables, never in code
- Use `.env.example` as the source of truth for required vars
- Fail fast on missing required config at startup, not at runtime
- Separate config by concern: database, mail, cache, queue

## Queue / Background Jobs

- Jobs should be idempotent (safe to retry)
- Include a `tries` and `backoff` strategy
- Log job start, success, and failure with context
- Use unique job IDs to prevent duplicates
