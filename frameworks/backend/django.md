# Django Conventions (Agent-Friendly)

## Project Structure

```
myproject/
├── manage.py
├── config/                      # Project settings (renamed from myproject/)
│   ├── __init__.py
│   ├── settings/
│   │   ├── base.py
│   │   ├── development.py
│   │   └── production.py
│   ├── urls.py
│   └── wsgi.py
├── apps/
│   └── users/                   # Feature/domain app
│       ├── __init__.py
│       ├── admin.py
│       ├── apps.py
│       ├── models.py
│       ├── views.py
│       ├── urls.py
│       ├── serializers.py       # DRF serializers
│       ├── services.py          # Business logic
│       ├── selectors.py         # Query logic (optional)
│       ├── types/
│       │   └── user.py
│       ├── enums/
│       │   └── user.py
│       ├── exceptions/
│       │   └── user.py
│       └── tests/
│           ├── __init__.py
│           ├── test_models.py
│           ├── test_views.py
│           └── test_services.py
├── shared/                      # Cross-app utilities
│   ├── exceptions.py
│   └── pagination.py
```

Rules:
- One app per domain/feature
- Keep apps in `apps/` directory
- Rename project config folder to `config/` for clarity
- Tests live inside each app

## Models

### Keep models focused on data

```python
from django.db import models
from apps.users.enums.user import UserRole


class User(models.Model):
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=255)
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.MEMBER,
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "users"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.email
```

Rules:
- No business logic in models (use services)
- Always set `db_table` explicitly
- Use `auto_now_add` / `auto_now` for timestamps

## Enums

```python
# apps/users/enums/user.py
from django.db import models


class UserRole(models.TextChoices):
    ADMIN = "admin", "Administrator"
    MANAGER = "manager", "Manager"
    MEMBER = "member", "Member"

    def can_manage_users(self) -> bool:
        return self in (UserRole.ADMIN, UserRole.MANAGER)
```

## Services (Business Logic)

### Fat services, thin views

```python
# apps/users/services.py
from django.db import transaction

from apps.users.models import User
from apps.users.enums.user import UserRole
from apps.users.exceptions.user import UserAlreadyExistsError


class UserService:
    @transaction.atomic
    def create_user(
        self,
        *,
        email: str,
        name: str,
        password: str,
        role: UserRole = UserRole.MEMBER,
    ) -> User:
        if User.objects.filter(email=email).exists():
            raise UserAlreadyExistsError(email)

        user = User.objects.create(
            email=email,
            name=name,
            role=role,
        )
        user.set_password(password)
        user.save(update_fields=["password"])

        return user

    def deactivate_user(self, *, user_id: int) -> User:
        user = User.objects.get(id=user_id)
        user.is_active = False
        user.save(update_fields=["is_active"])
        return user
```

Rules:
- Use keyword-only arguments (`*,`) for clarity
- Use `@transaction.atomic` for write operations
- Use `update_fields` in `save()` for partial updates
- Raise domain exceptions

## Selectors (Query Logic)

```python
# apps/users/selectors.py
from django.db.models import QuerySet

from apps.users.models import User
from apps.users.enums.user import UserRole


def get_active_users() -> QuerySet[User]:
    return User.objects.filter(is_active=True)


def get_users_by_role(role: UserRole) -> QuerySet[User]:
    return User.objects.filter(role=role, is_active=True)


def get_user_by_email(email: str) -> User | None:
    return User.objects.filter(email=email).first()
```

## Exceptions

```python
# apps/users/exceptions/user.py
class UserNotFoundError(Exception):
    def __init__(self, identifier: str | int) -> None:
        super().__init__(f"User not found: {identifier}")
        self.identifier = identifier


class UserAlreadyExistsError(Exception):
    def __init__(self, email: str) -> None:
        super().__init__(f"User already exists: {email}")
        self.email = email
```

## Views (Django REST Framework)

### Class-based views

```python
# apps/users/views.py
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.serializers import CreateUserSerializer, UserSerializer
from apps.users.services import UserService


class UserCreateView(APIView):
    def post(self, request: Request) -> Response:
        serializer = CreateUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        service = UserService()
        user = service.create_user(**serializer.validated_data)

        return Response(
            UserSerializer(user).data,
            status=status.HTTP_201_CREATED,
        )


class UserDetailView(APIView):
    def get(self, request: Request, user_id: int) -> Response:
        user = get_object_or_404(User, id=user_id)
        return Response(UserSerializer(user).data)
```

Rules:
- Validate with serializers
- Delegate logic to services
- Return serialized responses

## Serializers

```python
# apps/users/serializers.py
from rest_framework import serializers

from apps.users.models import User
from apps.users.enums.user import UserRole


class CreateUserSerializer(serializers.Serializer):
    email = serializers.EmailField()
    name = serializers.CharField(max_length=255)
    password = serializers.CharField(min_length=8, write_only=True)
    role = serializers.ChoiceField(
        choices=UserRole.choices,
        default=UserRole.MEMBER,
    )


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "name", "role", "is_active", "created_at"]
        read_only_fields = ["id", "created_at"]
```

## URLs

```python
# apps/users/urls.py
from django.urls import path

from apps.users.views import UserCreateView, UserDetailView

app_name = "users"

urlpatterns = [
    path("", UserCreateView.as_view(), name="create"),
    path("<int:user_id>/", UserDetailView.as_view(), name="detail"),
]
```

```python
# config/urls.py
from django.urls import include, path

urlpatterns = [
    path("api/users/", include("apps.users.urls")),
]
```

## Logging

```python
import logging

logger = logging.getLogger(__name__)


class UserService:
    def create_user(self, *, email: str, **kwargs) -> User:
        logger.info("Creating user", extra={"email": email})
        user = User.objects.create(email=email, **kwargs)
        logger.info("User created", extra={"user_id": user.id, "email": email})
        return user
```

## Testing

```python
# apps/users/tests/test_services.py
import pytest

from apps.users.services import UserService
from apps.users.exceptions.user import UserAlreadyExistsError


@pytest.mark.django_db
class TestUserService:
    def test_create_user_success(self):
        service = UserService()
        user = service.create_user(
            email="test@example.com",
            name="Test User",
            password="password123",
        )

        assert user.email == "test@example.com"
        assert user.check_password("password123")

    def test_create_user_duplicate_email_raises(self, user_factory):
        user_factory(email="existing@example.com")
        service = UserService()

        with pytest.raises(UserAlreadyExistsError):
            service.create_user(
                email="existing@example.com",
                name="Test",
                password="password123",
            )
```

## Migrations

```bash
# Create migrations
python manage.py makemigrations users

# Apply migrations
python manage.py migrate
```

Rules:
- One migration per logical change
- Never edit deployed migrations
- Name migrations descriptively

See [languages/python.md](../../languages/python.md) for Python-specific conventions.
