# Symfony Conventions (Agent-Friendly)

## Project Structure

```
src/
├── Controller/
│   └── UserController.php
├── Entity/
│   └── User.php
├── Repository/
│   └── UserRepository.php
├── Service/
│   └── UserService.php
├── DTO/
│   ├── CreateUserRequest.php
│   └── UserResponse.php
├── Enum/
│   └── UserRole.php
├── Exception/
│   └── UserNotFoundException.php
├── EventSubscriber/
│   └── ExceptionSubscriber.php
├── Security/
│   └── Voter/
│       └── UserVoter.php
├── Validator/
│   └── UniqueEmail.php
└── Message/                     # Messenger async messages
    └── SendWelcomeEmail.php
config/
├── packages/
├── routes/
└── services.yaml
migrations/
templates/
tests/
├── Controller/
├── Service/
└── Repository/
```

Rules:
- Follow Symfony Flex directory structure
- One class per file (PSR-4)
- Use services for business logic
- Keep controllers thin

## Controllers

### Thin controllers with autowiring

```php
<?php

declare(strict_types=1);

namespace App\Controller;

use App\DTO\CreateUserRequest;
use App\DTO\UserResponse;
use App\Service\UserService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/users')]
final class UserController extends AbstractController
{
    public function __construct(
        private readonly UserService $userService,
    ) {}

    #[Route('', methods: ['POST'])]
    public function create(
        #[MapRequestPayload] CreateUserRequest $request,
    ): JsonResponse {
        $user = $this->userService->create($request);

        return $this->json(
            UserResponse::from($user),
            Response::HTTP_CREATED,
        );
    }

    #[Route('/{id}', methods: ['GET'])]
    public function show(int $id): JsonResponse
    {
        $user = $this->userService->findOrFail($id);

        return $this->json(UserResponse::from($user));
    }

    #[Route('', methods: ['GET'])]
    public function index(): JsonResponse
    {
        $users = $this->userService->findAll();

        return $this->json(
            array_map(UserResponse::from(...), $users),
        );
    }
}
```

Rules:
- Use PHP 8 attributes for routes
- Use `#[MapRequestPayload]` for automatic DTO mapping
- Return DTOs, not entities
- Use appropriate HTTP status codes

## Services

### Business logic with dependency injection

```php
<?php

declare(strict_types=1);

namespace App\Service;

use App\DTO\CreateUserRequest;
use App\Entity\User;
use App\Enum\UserRole;
use App\Exception\UserNotFoundException;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final readonly class UserService
{
    public function __construct(
        private UserRepository $userRepository,
        private EntityManagerInterface $entityManager,
        private UserPasswordHasherInterface $passwordHasher,
    ) {}

    public function create(CreateUserRequest $request): User
    {
        $user = new User();
        $user->setEmail($request->email);
        $user->setName($request->name);
        $user->setRole($request->role ?? UserRole::Member);
        $user->setPassword(
            $this->passwordHasher->hashPassword($user, $request->password),
        );

        $this->entityManager->persist($user);
        $this->entityManager->flush();

        return $user;
    }

    public function findOrFail(int $id): User
    {
        return $this->userRepository->find($id)
            ?? throw UserNotFoundException::forId($id);
    }

    public function findAll(): array
    {
        return $this->userRepository->findBy(['isActive' => true]);
    }
}
```

## DTOs

### Request DTOs with validation

```php
<?php

declare(strict_types=1);

namespace App\DTO;

use App\Enum\UserRole;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class CreateUserRequest
{
    public function __construct(
        #[Assert\NotBlank]
        #[Assert\Email]
        public string $email,

        #[Assert\NotBlank]
        #[Assert\Length(min: 8)]
        public string $password,

        #[Assert\NotBlank]
        #[Assert\Length(max: 255)]
        public string $name,

        public ?UserRole $role = null,
    ) {}
}
```

### Response DTOs

```php
<?php

declare(strict_types=1);

namespace App\DTO;

use App\Entity\User;
use App\Enum\UserRole;

final readonly class UserResponse
{
    public function __construct(
        public int $id,
        public string $email,
        public string $name,
        public UserRole $role,
        public \DateTimeImmutable $createdAt,
    ) {}

    public static function from(User $user): self
    {
        return new self(
            id: $user->getId(),
            email: $user->getEmail(),
            name: $user->getName(),
            role: $user->getRole(),
            createdAt: $user->getCreatedAt(),
        );
    }
}
```

## Entities

### Doctrine entities

```php
<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\UserRole;
use App\Repository\UserRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: 'users')]
#[ORM\HasLifecycleCallbacks]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255, unique: true)]
    private string $email;

    #[ORM\Column]
    private string $password;

    #[ORM\Column(length: 255)]
    private string $name;

    #[ORM\Column(type: 'string', enumType: UserRole::class)]
    private UserRole $role = UserRole::Member;

    #[ORM\Column]
    private bool $isActive = true;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column]
    private \DateTimeImmutable $updatedAt;

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
    }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }

    // Getters and setters...

    public function getRoles(): array
    {
        return ['ROLE_USER', 'ROLE_' . strtoupper($this->role->value)];
    }

    public function getUserIdentifier(): string
    {
        return $this->email;
    }

    public function eraseCredentials(): void
    {
        // Clear temporary sensitive data
    }
}
```

## Enums

```php
<?php

declare(strict_types=1);

namespace App\Enum;

enum UserRole: string
{
    case Admin = 'admin';
    case Manager = 'manager';
    case Member = 'member';

    public function canManageUsers(): bool
    {
        return match ($this) {
            self::Admin, self::Manager => true,
            self::Member => false,
        };
    }
}
```

## Exceptions

```php
<?php

declare(strict_types=1);

namespace App\Exception;

use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class UserNotFoundException extends NotFoundHttpException
{
    public static function forId(int $id): self
    {
        return new self("User not found: {$id}");
    }

    public static function forEmail(string $email): self
    {
        return new self("User not found: {$email}");
    }
}
```

## Repositories

```php
<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\User;
use App\Enum\UserRole;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<User>
 */
final class UserRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, User::class);
    }

    public function findByEmail(string $email): ?User
    {
        return $this->findOneBy(['email' => $email]);
    }

    /**
     * @return User[]
     */
    public function findActiveByRole(UserRole $role): array
    {
        return $this->createQueryBuilder('u')
            ->where('u.isActive = :active')
            ->andWhere('u.role = :role')
            ->setParameter('active', true)
            ->setParameter('role', $role)
            ->orderBy('u.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }
}
```

## Event Subscribers

### Global exception handling

```php
<?php

declare(strict_types=1);

namespace App\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\KernelEvents;

final class ExceptionSubscriber implements EventSubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::EXCEPTION => 'onKernelException',
        ];
    }

    public function onKernelException(ExceptionEvent $event): void
    {
        $exception = $event->getThrowable();

        $statusCode = $exception instanceof HttpExceptionInterface
            ? $exception->getStatusCode()
            : 500;

        $response = new JsonResponse([
            'error' => $exception->getMessage(),
            'code' => $statusCode,
        ], $statusCode);

        $event->setResponse($response);
    }
}
```

## Testing

```php
<?php

declare(strict_types=1);

namespace App\Tests\Controller;

use App\Factory\UserFactory;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Zenstruck\Foundry\Test\Factories;
use Zenstruck\Foundry\Test\ResetDatabase;

final class UserControllerTest extends WebTestCase
{
    use Factories;
    use ResetDatabase;

    public function testCreateUser(): void
    {
        $client = static::createClient();

        $client->request('POST', '/api/users', [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode([
            'email' => 'test@example.com',
            'password' => 'password123',
            'name' => 'Test User',
        ]));

        $this->assertResponseStatusCodeSame(201);
        $this->assertJsonContains(['email' => 'test@example.com']);
    }

    public function testShowUser(): void
    {
        $user = UserFactory::createOne();
        $client = static::createClient();

        $client->request('GET', "/api/users/{$user->getId()}");

        $this->assertResponseIsSuccessful();
        $this->assertJsonContains(['email' => $user->getEmail()]);
    }
}
```

See [languages/php.md](../../languages/php.md) for PHP-specific conventions.
