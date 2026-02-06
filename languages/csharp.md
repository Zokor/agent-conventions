# C# Conventions (Agent-Friendly)

## Target Version

Target .NET 6+ / C# 10+ for modern features. Enable nullable reference types:

```xml
<PropertyGroup>
  <Nullable>enable</Nullable>
  <ImplicitUsings>enable</ImplicitUsings>
</PropertyGroup>
```

## Nullable Reference Types

### Handle nullability explicitly

```csharp
// ✅ Good — explicit nullability
public User? FindById(int id)
{
    return _users.FirstOrDefault(u => u.Id == id);
}

public User GetById(int id)
{
    return _users.FirstOrDefault(u => u.Id == id)
        ?? throw new UserNotFoundException(id);
}

// ❌ Bad — ambiguous
public User FindById(int id)
{
    return _users.FirstOrDefault(u => u.Id == id); // May return null!
}
```

### Use null-forgiving operator sparingly

```csharp
// Only when you're certain it's not null
var user = _users.Single(u => u.Id == id)!;

// Prefer explicit checks instead
var user = _users.SingleOrDefault(u => u.Id == id)
    ?? throw new UserNotFoundException(id);
```

## Records

### Use records for immutable data

```csharp
// ✅ Good — immutable, value equality
public sealed record User(int Id, string Name, string Email);

public sealed record CreateUserCommand(string Name, string Email);

public sealed record UserCreatedEvent(int UserId, DateTime CreatedAt);

// With additional members
public sealed record User(int Id, string Name, string Email)
{
    public string DisplayName => $"{Name} <{Email}>";
}
```

### Use record structs for small value types

```csharp
public readonly record struct Money(decimal Amount, string Currency);
public readonly record struct DateRange(DateOnly Start, DateOnly End);
```

## Init-Only Properties

### Use init for required but immutable properties

```csharp
public sealed class UserConfig
{
    public required string ApiKey { get; init; }
    public required string BaseUrl { get; init; }
    public int Timeout { get; init; } = 30;
}

// Usage
var config = new UserConfig
{
    ApiKey = "xxx",
    BaseUrl = "https://api.example.com",
};
```

## Pattern Matching

### Use switch expressions

```csharp
// ✅ Good — expression, exhaustive
public string GetStatusLabel(OrderStatus status) => status switch
{
    OrderStatus.Pending => "Waiting for payment",
    OrderStatus.Paid => "Payment received",
    OrderStatus.Shipped => "On the way",
    OrderStatus.Delivered => "Delivered",
    _ => throw new ArgumentOutOfRangeException(nameof(status)),
};
```

### Use pattern matching for type checks

```csharp
// ✅ Good — concise
if (result is User user)
{
    Console.WriteLine(user.Name);
}

// Property patterns
if (order is { Status: OrderStatus.Pending, Total: > 100 })
{
    ApplyDiscount(order);
}

// List patterns (C# 11+)
if (items is [var first, .., var last])
{
    Console.WriteLine($"First: {first}, Last: {last}");
}
```

## LINQ Best Practices

### Prefer method syntax for complex queries

```csharp
// ✅ Good — composable, readable
var activeAdmins = users
    .Where(u => u.IsActive)
    .Where(u => u.Role == UserRole.Admin)
    .OrderBy(u => u.Name)
    .ToList();
```

### Use appropriate methods

```csharp
// Single item
var user = users.Single(u => u.Id == id);      // Throws if not exactly one
var user = users.SingleOrDefault(u => u.Id == id); // Returns null if not found
var user = users.First(u => u.IsActive);       // First match
var user = users.FirstOrDefault(u => u.IsActive);  // First or null

// Existence checks
var hasAdmin = users.Any(u => u.Role == UserRole.Admin);
var allActive = users.All(u => u.IsActive);

// Avoid
var user = users.Where(u => u.Id == id).First(); // Use Single/First directly
```

### Materialize queries appropriately

```csharp
// ✅ Good — materialize when needed
var userList = users.Where(u => u.IsActive).ToList();
var userArray = users.Where(u => u.IsActive).ToArray();
var userDict = users.ToDictionary(u => u.Id);

// ✅ Also good — defer execution when iterating once
foreach (var user in users.Where(u => u.IsActive))
{
    // ...
}
```

## Async/Await

### Use async all the way

```csharp
// ✅ Good — async throughout
public async Task<User> GetUserAsync(int id, CancellationToken ct = default)
{
    var user = await _repository.FindByIdAsync(id, ct);
    return user ?? throw new UserNotFoundException(id);
}

// ❌ Bad — blocking on async
public User GetUser(int id)
{
    return _repository.FindByIdAsync(id).Result; // Deadlock risk!
}
```

### Accept CancellationToken

```csharp
public async Task<IReadOnlyList<User>> GetUsersAsync(
    UserFilter filter,
    CancellationToken cancellationToken = default)
{
    return await _context.Users
        .Where(u => u.IsActive == filter.IsActive)
        .ToListAsync(cancellationToken);
}
```

### Use ValueTask for hot paths

```csharp
// For methods that often complete synchronously
public ValueTask<User?> GetCachedUserAsync(int id)
{
    if (_cache.TryGetValue(id, out var user))
    {
        return ValueTask.FromResult<User?>(user);
    }
    return new ValueTask<User?>(FetchAndCacheUserAsync(id));
}
```

## Using Declarations

```csharp
// ✅ Good — using declaration (C# 8+)
public async Task ProcessFileAsync(string path)
{
    using var stream = File.OpenRead(path);
    using var reader = new StreamReader(stream);
    // disposed at end of scope
}

// ❌ Bad — nested using statements
public async Task ProcessFileAsync(string path)
{
    using (var stream = File.OpenRead(path))
    {
        using (var reader = new StreamReader(stream))
        {
            // ...
        }
    }
}
```

## File-Scoped Namespaces

```csharp
// ✅ Good — file-scoped (C# 10+)
namespace MyApp.Domain.Users;

public sealed class User
{
    // ...
}

// ❌ Bad — block-scoped
namespace MyApp.Domain.Users
{
    public sealed class User
    {
        // ...
    }
}
```

## Primary Constructors (C# 12+)

```csharp
// ✅ Good — concise DI
public sealed class UserService(
    IUserRepository repository,
    ILogger<UserService> logger)
{
    public async Task<User> GetUserAsync(int id)
    {
        logger.LogInformation("Fetching user {UserId}", id);
        return await repository.FindByIdAsync(id)
            ?? throw new UserNotFoundException(id);
    }
}
```

## File Organization

Follow C# conventions — one public type per file:
- `Domain/Users/User.cs`
- `Domain/Users/UserRole.cs`
- `Domain/Users/UserNotFoundException.cs`

See [SKILL.md](../SKILL.md) for full file organization rules.
