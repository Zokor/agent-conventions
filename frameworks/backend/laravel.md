# Laravel / PHP Conventions

## Directory Organization

```
app/
  Models/
    User.php                    ← Eloquent model
  Services/
    UserService.php             ← Business logic
  Actions/
    CreateUserAction.php        ← Single-responsibility action classes
  Http/
    Controllers/
      UserController.php
    Requests/
      CreateUserRequest.php     ← Form request validation
    Middleware/
      EnsureUserIsAdmin.php
    Resources/
      UserResource.php          ← API resource transformers
  Enums/
    UserRole.php                ← PHP 8.1+ backed enums
  Exceptions/
    UserNotFoundException.php   ← Domain-specific exceptions
  DTOs/
    UserData.php                ← Data transfer objects

tests/
  Feature/
    UserControllerTest.php      ← HTTP/integration tests
  Unit/
    UserServiceTest.php         ← Unit tests
    Actions/
      CreateUserActionTest.php
```

## Models — Lean and Queryable

Models define relationships, scopes, casts, and accessors. Business logic goes in Services or Actions.

```php
// ✅ Good — lean model
class User extends Model
{
    protected $fillable = ['name', 'email', 'role'];

    protected function casts(): array
    {
        return [
            'role' => UserRole::class,
            'email_verified_at' => 'datetime',
        ];
    }

    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active');
    }
}

// ❌ Bad — business logic in model
class User extends Model
{
    public function sendWelcomeEmail() { /* ... */ }
    public function calculateSubscriptionPrice() { /* ... */ }
}
```

## Enums — Use PHP 8.1+ Backed Enums

```php
// ✅ Good — typed, grep-able
enum UserRole: string
{
    case Admin = 'admin';
    case Manager = 'manager';
    case Member = 'member';
}

// ❌ Bad — string constants scattered across files
const ROLE_ADMIN = 'admin';
```

## Services & Actions

**Services** group related operations. **Actions** handle single operations.

```php
// ✅ Action pattern — single responsibility
class CreateUserAction
{
    public function __construct(
        private readonly UserService $userService,
    ) {}

    public function execute(UserData $data): User
    {
        $user = User::create($data->toArray());
        $this->userService->sendWelcomeEmail($user);
        return $user;
    }
}
```

## Controllers — Thin, Delegate to Services/Actions

```php
// ✅ Good — thin controller
class UserController extends Controller
{
    public function store(CreateUserRequest $request, CreateUserAction $action): JsonResponse
    {
        $user = $action->execute(UserData::from($request->validated()));

        return UserResource::make($user)
            ->response()
            ->setStatusCode(201);
    }
}

// ❌ Bad — fat controller with business logic
class UserController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([...]);
        $user = User::create($validated);
        Mail::to($user)->send(new WelcomeMail());
        // ... 50 more lines
    }
}
```

## Form Requests — Always Validate at the Boundary

```php
class CreateUserRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users'],
            'role' => ['required', Rule::enum(UserRole::class)],
        ];
    }
}
```

Never use `$request->all()` or unvalidated input.

## Exceptions — Domain-Specific, Typed

```php
// ✅ Good — typed, catchable, structured
class UserNotFoundException extends ModelNotFoundException
{
    public static function forId(int $id): static
    {
        return new static("User with ID {$id} not found.");
    }
}

// Usage
throw UserNotFoundException::forId($userId);
```

## Logging — Structured With Context

```php
// ✅ Good
Log::info('user.created', ['user_id' => $user->id, 'email' => $user->email]);
Log::error('payment.failed', ['order_id' => $orderId, 'reason' => $e->getMessage()]);

// ❌ Bad
Log::info("User {$user->id} was created");
logger("something happened");
```

## Livewire Conventions

```
resources/views/livewire/
  user-list.blade.php           ← kebab-case blade file
app/Livewire/
  UserList.php                  ← PascalCase component class
```

### Livewire component rules:

```php
class UserList extends Component
{
    // ✅ Typed properties with defaults
    public string $search = '';
    public UserRole $filterRole = UserRole::Member;

    // ✅ Validation rules for bound properties
    protected $rules = [
        'search' => 'string|max:255',
    ];

    // ✅ Computed properties over redundant state
    #[Computed]
    public function users(): LengthAwarePaginator
    {
        return User::query()
            ->when($this->search, fn ($q) => $q->where('name', 'like', "%{$this->search}%"))
            ->when($this->filterRole, fn ($q) => $q->where('role', $this->filterRole))
            ->paginate(15);
    }

    // ❌ Bad — storing derived data as state
    public Collection $users;
    public function updatedSearch(): void
    {
        $this->users = User::where('name', 'like', "%{$this->search}%")->get();
    }
}
```

## Testing

- **Feature tests** for HTTP endpoints (controllers, middleware, routes)
- **Unit tests** for services, actions, and business logic
- Use factories for model creation, never raw `create()` in tests
- Name test methods descriptively: `test_admin_can_delete_users()`

```php
// ✅ Good
it('creates a user with valid data', function () {
    $response = $this->postJson('/api/users', [
        'name' => 'John',
        'email' => 'john@example.com',
        'role' => 'admin',
    ]);

    $response->assertStatus(201);
    $this->assertDatabaseHas('users', ['email' => 'john@example.com']);
});
```

## Database

- Always use migrations, never manual SQL
- Use `$table->foreignId('user_id')->constrained()` over raw foreign keys
- Eager-load relationships to avoid N+1 (use `->with()`)
- Index columns used in `where`, `orderBy`, and `join` clauses
