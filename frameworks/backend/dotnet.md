# .NET Conventions (ASP.NET Core)

## Recommended Structure (Clean Architecture-ish)

This keeps boundaries obvious to agents and humans:

```
src/
  MyApp.Api/                    # HTTP boundary
    Endpoints/                  # minimal APIs (or Controllers/)
    Middleware/
    DependencyInjection/
  MyApp.Application/            # use-cases
    Users/
      Commands/
      Queries/
      Dtos/
      Services/
  MyApp.Domain/                 # pure domain
    Users/
      User.cs
      UserRole.cs
      Errors/
        UserNotFoundException.cs
  MyApp.Infrastructure/         # EF Core, external services
    Persistence/
    External/
tests/
  MyApp.Api.Tests/
  MyApp.Application.Tests/
```

Rules:
- One public type per file (C# convention).
- Namespace matches folder (don’t get “creative”).
- Dependencies flow inward: `Api` → `Application` → `Domain`; `Infrastructure` plugs in from the outside.

## Endpoints / Controllers

### Keep handlers thin

- Validate at the boundary (model binding + validation).
- Translate HTTP → application command/query.
- No EF Core queries inside endpoints/controllers.

Prefer returning Problem Details (RFC 7807) for errors; keep error mapping in one place (middleware/filter).

## Application Layer

- Use explicit request/response types (`record` DTOs).
- Prefer `CancellationToken` in async methods.

```csharp
public sealed record CreateUserCommand(string Email, string Name);
public sealed record CreateUserResult(Guid UserId);
```

## Domain Layer

- No EF Core, no HttpClient, no IConfiguration.
- Use domain exceptions/errors that are catchable and searchable (ex: `UserNotFoundException`).

## Infrastructure Layer

- EF Core stays here (DbContext, migrations, repositories/query objects if used).
- Use `AsNoTracking()` for read-only queries.
- No string-interpolated SQL; use parameterization (or LINQ).

## Logging

- Use structured logging, not string concatenation.

```csharp
logger.LogInformation("user.created {UserId} {Email}", userId, email);
```

## Testing

- Prefer xUnit + FluentAssertions (if already in repo).
- Unit test application/domain logic without ASP.NET hosting.
- Integration tests spin up the API (TestServer/WebApplicationFactory) and hit endpoints.

