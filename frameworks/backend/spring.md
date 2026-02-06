# Spring Boot Conventions (Agent-Friendly)

## Project Structure

```
src/main/java/com/example/myapp/
├── MyAppApplication.java        # Entry point
├── config/                      # Configuration classes
├── features/
│   └── users/
│       ├── UserController.java
│       ├── UserService.java
│       ├── UserRepository.java
│       ├── dto/
│       │   ├── CreateUserRequest.java
│       │   └── UserResponse.java
│       ├── domain/
│       │   ├── User.java
│       │   └── UserRole.java
│       └── exceptions/
│           └── UserNotFoundException.java
├── shared/
│   ├── exceptions/
│   │   └── GlobalExceptionHandler.java
│   └── validation/
src/main/resources/
├── application.yml
└── db/migration/                # Flyway migrations
src/test/java/
└── com/example/myapp/features/users/
```

Rules:
- Organize by **feature/domain**, not by technical layer
- One public class per file (Java convention)
- Keep `config/` for cross-cutting configuration
- Put shared exceptions/utilities in `shared/`

## Controllers

### Keep controllers thin

```java
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse create(@Valid @RequestBody CreateUserRequest request) {
        return userService.create(request);
    }

    @GetMapping("/{id}")
    public UserResponse getById(@PathVariable Long id) {
        return userService.getById(id);
    }
}
```

Rules:
- No business logic in controllers
- Use `@Valid` for request validation
- Return DTOs, not entities
- Use appropriate HTTP status codes

## Services

### Business logic lives here

```java
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public UserResponse create(CreateUserRequest request) {
        var user = User.builder()
            .email(request.email())
            .password(passwordEncoder.encode(request.password()))
            .role(UserRole.MEMBER)
            .build();

        var saved = userRepository.save(user);
        return UserResponse.from(saved);
    }

    public UserResponse getById(Long id) {
        return userRepository.findById(id)
            .map(UserResponse::from)
            .orElseThrow(() -> new UserNotFoundException(id));
    }
}
```

Rules:
- Use `@Transactional(readOnly = true)` at class level, override for writes
- Throw domain exceptions, not generic ones
- Map entities to DTOs before returning

## DTOs

### Use records for immutable DTOs

```java
// Request DTO with validation
public record CreateUserRequest(
    @NotBlank @Email String email,
    @NotBlank @Size(min = 8) String password,
    @NotBlank String name
) {}

// Response DTO with factory method
public record UserResponse(
    Long id,
    String email,
    String name,
    UserRole role,
    Instant createdAt
) {
    public static UserResponse from(User user) {
        return new UserResponse(
            user.getId(),
            user.getEmail(),
            user.getName(),
            user.getRole(),
            user.getCreatedAt()
        );
    }
}
```

## Entities

### JPA entities stay lean

```java
@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        createdAt = Instant.now();
    }
}
```

Rules:
- Use `@Enumerated(EnumType.STRING)` for enums (not ORDINAL)
- Protected no-arg constructor for JPA
- No business logic in entities

## Enums

```java
public enum UserRole {
    ADMIN,
    MANAGER,
    MEMBER;

    public boolean canManageUsers() {
        return this == ADMIN || this == MANAGER;
    }
}
```

## Exceptions

### Domain-specific exceptions

```java
@ResponseStatus(HttpStatus.NOT_FOUND)
public class UserNotFoundException extends RuntimeException {

    public UserNotFoundException(Long id) {
        super("User not found: " + id);
    }

    public UserNotFoundException(String email) {
        super("User not found: " + email);
    }
}
```

### Global exception handler

```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(UserNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ProblemDetail handleNotFound(UserNotFoundException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ProblemDetail handleValidation(MethodArgumentNotValidException ex) {
        var detail = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        detail.setProperty("errors", ex.getFieldErrors().stream()
            .collect(Collectors.toMap(
                FieldError::getField,
                FieldError::getDefaultMessage
            )));
        return detail;
    }
}
```

## Repositories

```java
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u WHERE u.role = :role AND u.createdAt > :since")
    List<User> findActiveByRole(@Param("role") UserRole role, @Param("since") Instant since);
}
```

## Logging

```java
@Slf4j
@Service
public class UserService {

    public UserResponse create(CreateUserRequest request) {
        log.info("Creating user with email={}", request.email());
        // ...
        log.info("User created userId={}", saved.getId());
        return UserResponse.from(saved);
    }
}
```

## Configuration

### Use `application.yml` with profiles

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/myapp
  jpa:
    open-in-view: false
    hibernate:
      ddl-auto: validate

---
spring:
  config:
    activate:
      on-profile: test
  datasource:
    url: jdbc:h2:mem:testdb
```

## Testing

```java
@SpringBootTest
@AutoConfigureMockMvc
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void createUser_withValidData_returns201() throws Exception {
        mockMvc.perform(post("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email": "test@example.com", "password": "password123", "name": "Test"}
                    """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.email").value("test@example.com"));
    }
}
```

See [languages/java.md](../../languages/java.md) for Java-specific conventions (when available).
