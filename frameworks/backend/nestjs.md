# NestJS Conventions (Agent-Friendly)

## Project Structure

```
src/
├── main.ts                      # Bootstrap
├── app.module.ts                # Root module
├── config/
│   └── configuration.ts
├── features/
│   └── users/
│       ├── users.module.ts
│       ├── users.controller.ts
│       ├── users.service.ts
│       ├── users.repository.ts  # Optional: data access
│       ├── dto/
│       │   ├── create-user.dto.ts
│       │   └── user-response.dto.ts
│       ├── entities/
│       │   └── user.entity.ts
│       ├── enums/
│       │   └── user-role.enum.ts
│       ├── errors/
│       │   └── user-not-found.error.ts
│       └── tests/
│           ├── users.controller.spec.ts
│           └── users.service.spec.ts
├── shared/
│   ├── filters/
│   │   └── http-exception.filter.ts
│   ├── guards/
│   │   └── auth.guard.ts
│   ├── interceptors/
│   │   └── logging.interceptor.ts
│   └── decorators/
│       └── current-user.decorator.ts
```

Rules:
- Organize by **feature modules**, not technical layers
- Each feature is self-contained with its own module
- Keep shared utilities in `shared/`

## Modules

### One module per feature

```typescript
// features/users/users.module.ts
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { UsersController } from './users.controller'
import { UsersService } from './users.service'
import { User } from './entities/user.entity'

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // Export if used by other modules
})
export class UsersModule {}
```

## Controllers

### Keep controllers thin

```typescript
// features/users/users.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common'

import { UsersService } from './users.service'
import { CreateUserDto } from './dto/create-user.dto'
import { UserResponseDto } from './dto/user-response.dto'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.usersService.create(createUserDto)
    return UserResponseDto.from(user)
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<UserResponseDto> {
    const user = await this.usersService.findOne(id)
    return UserResponseDto.from(user)
  }
}
```

Rules:
- Use appropriate HTTP status codes
- Use ParseIntPipe, ParseUUIDPipe for validation
- Return DTOs, not entities

## Services

### Business logic lives here

```typescript
// features/users/users.service.ts
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { User } from './entities/user.entity'
import { CreateUserDto } from './dto/create-user.dto'
import { UserNotFoundError } from './errors/user-not-found.error'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const user = this.usersRepository.create(dto)
    return this.usersRepository.save(user)
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } })
    if (!user) {
      throw new UserNotFoundError(id)
    }
    return user
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } })
  }
}
```

## DTOs

### Use class-validator for validation

```typescript
// features/users/dto/create-user.dto.ts
import { IsEmail, IsNotEmpty, IsEnum, MinLength } from 'class-validator'
import { UserRole } from '../enums/user-role.enum'

export class CreateUserDto {
  @IsNotEmpty()
  @IsEmail()
  email: string

  @IsNotEmpty()
  @MinLength(8)
  password: string

  @IsNotEmpty()
  name: string

  @IsEnum(UserRole)
  role: UserRole = UserRole.MEMBER
}
```

```typescript
// features/users/dto/user-response.dto.ts
import { User } from '../entities/user.entity'
import { UserRole } from '../enums/user-role.enum'

export class UserResponseDto {
  id: number
  email: string
  name: string
  role: UserRole
  createdAt: Date

  static from(user: User): UserResponseDto {
    const dto = new UserResponseDto()
    dto.id = user.id
    dto.email = user.email
    dto.name = user.name
    dto.role = user.role
    dto.createdAt = user.createdAt
    return dto
  }
}
```

## Entities

```typescript
// features/users/entities/user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm'

import { UserRole } from '../enums/user-role.enum'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ unique: true })
  email: string

  @Column()
  password: string

  @Column()
  name: string

  @Column({ type: 'enum', enum: UserRole, default: UserRole.MEMBER })
  role: UserRole

  @Column({ default: true })
  isActive: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
```

## Enums

```typescript
// features/users/enums/user-role.enum.ts
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  MEMBER = 'member',
}
```

## Custom Exceptions

```typescript
// features/users/errors/user-not-found.error.ts
import { NotFoundException } from '@nestjs/common'

export class UserNotFoundError extends NotFoundException {
  constructor(id: number | string) {
    super(`User not found: ${id}`)
  }
}
```

## Exception Filters

```typescript
// shared/filters/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { Response } from 'express'

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error'

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    })
  }
}
```

## Guards

```typescript
// shared/guards/auth.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    return this.validateRequest(request)
  }

  private validateRequest(request: any): boolean {
    // Implement auth logic
    return !!request.headers.authorization
  }
}
```

## Custom Decorators

```typescript
// shared/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common'

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest()
    return request.user
  },
)

// Usage
@Get('profile')
getProfile(@CurrentUser() user: User) {
  return user
}
```

## Testing

```typescript
// features/users/tests/users.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'

import { UsersService } from '../users.service'
import { User } from '../entities/user.entity'

describe('UsersService', () => {
  let service: UsersService
  let mockRepository: Partial<Repository<User>>

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockRepository },
      ],
    }).compile()

    service = module.get<UsersService>(UsersService)
  })

  it('should create a user', async () => {
    const dto = { email: 'test@example.com', password: 'pass', name: 'Test' }
    const user = { id: 1, ...dto }

    jest.spyOn(mockRepository, 'create').mockReturnValue(user as User)
    jest.spyOn(mockRepository, 'save').mockResolvedValue(user as User)

    const result = await service.create(dto)
    expect(result.email).toBe(dto.email)
  })
})
```

See [languages/typescript.md](../../languages/typescript.md) for TypeScript conventions.
