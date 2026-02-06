# PHP Conventions (Agent-Friendly)

## Version Requirements

Target PHP 8.1+ to use modern features. Enable strict types in every file:

```php
<?php

declare(strict_types=1);
```

## Enums (PHP 8.1+)

### Use backed enums

```php
// ✅ Good — typed, grep-able, serializable
enum UserRole: string
{
    case Admin = 'admin';
    case Manager = 'manager';
    case Member = 'member';
}

// Usage
$role = UserRole::Admin;
$role->value; // 'admin'
UserRole::from('admin'); // UserRole::Admin
UserRole::tryFrom('invalid'); // null

// ❌ Bad — scattered constants, no type safety
const ROLE_ADMIN = 'admin';
const ROLE_MANAGER = 'manager';
```

### Add methods to enums when useful

```php
enum OrderStatus: string
{
    case Pending = 'pending';
    case Paid = 'paid';
    case Shipped = 'shipped';
    case Delivered = 'delivered';

    public function isFinal(): bool
    {
        return $this === self::Delivered;
    }

    public function canTransitionTo(self $next): bool
    {
        return match ($this) {
            self::Pending => $next === self::Paid,
            self::Paid => $next === self::Shipped,
            self::Shipped => $next === self::Delivered,
            self::Delivered => false,
        };
    }
}
```

## Readonly Properties and Classes (PHP 8.1+/8.2+)

### Use readonly for immutable data

```php
// ✅ Good — immutable DTO
readonly class UserData
{
    public function __construct(
        public string $name,
        public string $email,
        public UserRole $role,
    ) {}
}

// Or individual properties
class User
{
    public function __construct(
        public readonly int $id,
        public string $name, // mutable
    ) {}
}
```

## Constructor Property Promotion

### Always use promotion for simple constructors

```php
// ✅ Good — concise
class CreateUserAction
{
    public function __construct(
        private readonly UserRepository $users,
        private readonly Mailer $mailer,
    ) {}
}

// ❌ Bad — verbose
class CreateUserAction
{
    private UserRepository $users;
    private Mailer $mailer;

    public function __construct(UserRepository $users, Mailer $mailer)
    {
        $this->users = $users;
        $this->mailer = $mailer;
    }
}
```

## Match Expressions (PHP 8.0+)

### Prefer match over switch for value returns

```php
// ✅ Good — expression, exhaustive
$label = match ($status) {
    OrderStatus::Pending => 'Waiting for payment',
    OrderStatus::Paid => 'Payment received',
    OrderStatus::Shipped => 'On the way',
    OrderStatus::Delivered => 'Delivered',
};

// ❌ Bad — statement, fallthrough risk
switch ($status) {
    case OrderStatus::Pending:
        $label = 'Waiting for payment';
        break;
    // ...
}
```

## Named Arguments (PHP 8.0+)

### Use for clarity with many parameters or booleans

```php
// ✅ Good — clear intent
$user = new User(
    name: 'John',
    email: 'john@example.com',
    isAdmin: false,
    sendWelcomeEmail: true,
);

// ❌ Bad — unclear booleans
$user = new User('John', 'john@example.com', false, true);
```

## Attributes (PHP 8.0+)

### Use for metadata instead of docblocks

```php
// ✅ Good — native attributes
#[Route('/users/{id}', methods: ['GET'])]
#[Middleware('auth')]
public function show(int $id): JsonResponse
{
    // ...
}

// Also good for validation
readonly class CreateUserRequest
{
    public function __construct(
        #[Assert\NotBlank]
        #[Assert\Length(max: 255)]
        public string $name,

        #[Assert\Email]
        public string $email,
    ) {}
}
```

## Type Declarations

### Always declare parameter and return types

```php
// ✅ Good — fully typed
public function findById(int $id): ?User
{
    return $this->users->find($id);
}

public function create(UserData $data): User
{
    // ...
}

// ❌ Bad — untyped
public function findById($id)
{
    return $this->users->find($id);
}
```

### Use union types when appropriate

```php
public function find(int|string $id): User|null
{
    // ...
}
```

### Use intersection types for interfaces

```php
public function process(Countable&Iterator $items): void
{
    // ...
}
```

## Nullsafe Operator (PHP 8.0+)

```php
// ✅ Good
$city = $user?->address?->city;

// ❌ Bad
$city = $user !== null && $user->address !== null
    ? $user->address->city
    : null;
```

## Exceptions

### Create domain-specific exceptions

```php
// ✅ Good — typed, catchable
class UserNotFoundException extends RuntimeException
{
    public static function forId(int $id): self
    {
        return new self("User with ID {$id} not found.");
    }

    public static function forEmail(string $email): self
    {
        return new self("User with email {$email} not found.");
    }
}

// Usage
throw UserNotFoundException::forId($userId);
```

## File Organization

Follow framework conventions (PSR-4):
- `app/Enums/UserRole.php` — one enum per file
- `app/Exceptions/UserNotFoundException.php` — one exception per file
- `app/DTOs/UserData.php` — one DTO per file

See [SKILL.md](../SKILL.md) for full file organization rules.
