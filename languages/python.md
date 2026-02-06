# Python Conventions (Agent-Friendly)

## Project Layout

Prefer the `src/` layout for predictable imports:

```
pyproject.toml
src/
  my_app/
    __init__.py
    features/
      users/
        services/
        api/
        types/
          user.py
        enums/
          user.py
        errors/
          user.py
tests/
  features/
    users/
```

Rules:
- Package/module names: `snake_case`
- Classes/types: `PascalCase`
- Functions/vars: `snake_case`
- Keep features self-contained; shared code goes in `my_app/shared/`.

## Typing (Default On)

- Add type hints for all public functions.
- Prefer `from __future__ import annotations` in new modules.
- Avoid `Any` unless you’re at an external boundary.
- Prefer `Protocol` for interfaces when you need structural typing.

## File Splitting

Agent-friendly default:
- **One domain concept per file** inside `types/`, `enums/`, `errors/`.

Examples:
- `types/user.py` contains only user-related type aliases / TypedDict / dataclasses
- `enums/user.py` contains only user-related `Enum`s
- `errors/user.py` contains only user-related exception classes

Keep modules small and searchable; avoid dumping unrelated helpers into `utils.py`.

## Errors

Prefer typed exceptions:

```py
class UserNotFoundError(Exception):
    def __init__(self, user_id: str) -> None:
        super().__init__(f"User not found: {user_id}")
        self.user_id = user_id
```

Raise typed errors in services; map them to HTTP responses at the boundary (framework layer).

## Logging

Use the stdlib `logging` module (or repo standard). Log events with structured context:

```py
logger.info("user.created", extra={"user_id": user_id, "email": email})
```

Never log secrets/tokens/PII in plaintext.

## Testing

- Prefer `pytest` (if already in repo).
- Tests should mirror the feature structure (either colocated or under `tests/`).
- Test behavior; don’t assert on internal implementation details.

