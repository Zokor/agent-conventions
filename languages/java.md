# Java Conventions (Agent-Friendly)

## Version Requirements

Target Java 17+ (LTS) for modern features:
- Records
- Sealed classes
- Pattern matching
- Text blocks

## Records (Java 16+)

### Use records for immutable data

```java
// ✅ Good — immutable, concise
public record User(Long id, String name, String email, UserRole role) {}

public record CreateUserRequest(
    @NotBlank String name,
    @NotBlank @Email String email
) {}

// With additional methods
public record Money(BigDecimal amount, Currency currency) {
    public Money add(Money other) {
        if (!currency.equals(other.currency)) {
            throw new IllegalArgumentException("Currency mismatch");
        }
        return new Money(amount.add(other.amount), currency);
    }
}
```

### Compact constructors for validation

```java
public record User(Long id, String name, String email) {
    public User {
        Objects.requireNonNull(name, "name must not be null");
        Objects.requireNonNull(email, "email must not be null");
    }
}
```

## Sealed Classes (Java 17+)

### Use for closed hierarchies

```java
// ✅ Good — exhaustive pattern matching
public sealed interface Result<T> permits Success, Failure {
}

public record Success<T>(T value) implements Result<T> {}
public record Failure<T>(Exception error) implements Result<T> {}

// Usage with pattern matching
public String handle(Result<User> result) {
    return switch (result) {
        case Success<User>(var user) -> "User: " + user.name();
        case Failure<User>(var error) -> "Error: " + error.getMessage();
    };
}
```

## Pattern Matching

### Switch expressions (Java 14+)

```java
// ✅ Good — exhaustive, expression
public String getStatusLabel(OrderStatus status) {
    return switch (status) {
        case PENDING -> "Waiting for payment";
        case PAID -> "Payment received";
        case SHIPPED -> "On the way";
        case DELIVERED -> "Delivered";
    };
}
```

### Pattern matching for instanceof (Java 16+)

```java
// ✅ Good — no explicit cast
if (obj instanceof User user) {
    System.out.println(user.name());
}

// With guards (Java 21+)
if (obj instanceof User user && user.isActive()) {
    process(user);
}
```

### Record patterns (Java 21+)

```java
// Destructure records in patterns
if (result instanceof Success<User>(var user)) {
    System.out.println(user.name());
}

// In switch
return switch (shape) {
    case Circle(var radius) -> Math.PI * radius * radius;
    case Rectangle(var w, var h) -> w * h;
};
```

## Optional

### Use for potentially absent values

```java
// ✅ Good — explicit absence
public Optional<User> findByEmail(String email) {
    return Optional.ofNullable(userMap.get(email));
}

// Chain operations
String displayName = findByEmail(email)
    .map(User::name)
    .orElse("Anonymous");

// Throw on absence
User user = findByEmail(email)
    .orElseThrow(() -> new UserNotFoundException(email));

// ❌ Bad — Optional in fields
public class User {
    private Optional<String> nickname; // Don't do this
}
```

### Never return null from Optional-returning methods

```java
// ❌ Bad
public Optional<User> findById(Long id) {
    if (id == null) return null; // Never!
}

// ✅ Good
public Optional<User> findById(Long id) {
    if (id == null) return Optional.empty();
    return Optional.ofNullable(userMap.get(id));
}
```

## Streams

### Prefer streams for collection transformations

```java
// ✅ Good — declarative
List<String> activeUserNames = users.stream()
    .filter(User::isActive)
    .map(User::name)
    .sorted()
    .toList();

// Collect to map
Map<Long, User> userById = users.stream()
    .collect(Collectors.toMap(User::id, Function.identity()));

// Group by
Map<UserRole, List<User>> byRole = users.stream()
    .collect(Collectors.groupingBy(User::role));

// ❌ Bad — imperative
List<String> names = new ArrayList<>();
for (User user : users) {
    if (user.isActive()) {
        names.add(user.name());
    }
}
Collections.sort(names);
```

### Use appropriate terminal operations

```java
// Find first match
Optional<User> admin = users.stream()
    .filter(u -> u.role() == UserRole.ADMIN)
    .findFirst();

// Check existence
boolean hasAdmin = users.stream()
    .anyMatch(u -> u.role() == UserRole.ADMIN);

// Count
long activeCount = users.stream()
    .filter(User::isActive)
    .count();
```

## Text Blocks (Java 15+)

```java
// ✅ Good — readable multiline strings
String json = """
    {
        "name": "%s",
        "email": "%s"
    }
    """.formatted(name, email);

String sql = """
    SELECT u.id, u.name, u.email
    FROM users u
    WHERE u.is_active = true
    ORDER BY u.created_at DESC
    """;
```

## Null Safety

### Use annotations for documentation

```java
import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;

public @NotNull User getById(@NotNull Long id) {
    return userRepository.findById(id)
        .orElseThrow(() -> new UserNotFoundException(id));
}

public @Nullable User findByEmail(@NotNull String email) {
    return userRepository.findByEmail(email).orElse(null);
}
```

### Prefer Objects.requireNonNull at boundaries

```java
public UserService(UserRepository repository) {
    this.repository = Objects.requireNonNull(repository, "repository");
}
```

## Enums

### Add behavior to enums when useful

```java
public enum UserRole {
    ADMIN("Administrator", true),
    MANAGER("Manager", true),
    MEMBER("Member", false);

    private final String displayName;
    private final boolean canManageUsers;

    UserRole(String displayName, boolean canManageUsers) {
        this.displayName = displayName;
        this.canManageUsers = canManageUsers;
    }

    public String displayName() {
        return displayName;
    }

    public boolean canManageUsers() {
        return canManageUsers;
    }
}
```

## Exceptions

### Create domain-specific exceptions

```java
public class UserNotFoundException extends RuntimeException {

    private final Long userId;

    public UserNotFoundException(Long userId) {
        super("User not found: " + userId);
        this.userId = userId;
    }

    public Long getUserId() {
        return userId;
    }
}
```

## Immutability

### Prefer immutable collections

```java
// ✅ Good — immutable
List<String> names = List.of("Alice", "Bob", "Charlie");
Set<Integer> ids = Set.of(1, 2, 3);
Map<String, Integer> scores = Map.of("Alice", 100, "Bob", 95);

// Return unmodifiable views
public List<User> getUsers() {
    return Collections.unmodifiableList(users);
}

// Or copy to immutable
public List<User> getUsers() {
    return List.copyOf(users);
}
```

## File Organization

Follow Java conventions — one public class per file:
- `domain/User.java`
- `domain/UserRole.java`
- `exceptions/UserNotFoundException.java`
- `services/UserService.java`

See [SKILL.md](../SKILL.md) for full file organization rules.
