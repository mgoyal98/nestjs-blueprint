# NestJS-Blueprint

NestJS-Blueprint is a scalable starter template for building robust NestJS applications. It comes with batteries-included integrations for AWS, databases, observability, security, and more—empowering you to quickly launch production-grade APIs and real-time systems with best practices.

## Features

- **Modular Architecture**: Organize your code with clear separation of concerns using modules for users, authentication, examples, and more.
- **Database Integration**: 
  - Built-in MongoDB support via Mongoose, with async configuration and robust connection event logging.
- **Authentication & Security**:
  - JWT-based authentication guard.
  - API key guard for securing endpoints.
  - Centralized exception handling and validation.
  - CORS and Helmet for secure HTTP headers.
- **AWS Integration**:
  - AWS S3 integration with utilities for file upload, download, deletion, listing, and presigned URLs.
  - Flexible credential management (env or IAM role).
- **Observability & Logging**:
  - OpenTelemetry tracing and metrics (OTLP exporter ready).
  - Context-aware, structured logging with Winston.
  - PII masking for sensitive fields in logs.
  - Correlation IDs and user context propagation.
- **HTTP Connector**:
  - Centralized, configurable HTTP client for outbound API calls with logging and error handling.
- **Caching System**:
  - Redis-based caching with automatic and manual caching capabilities.
  - Decorator-based caching with configurable TTL and key patterns.
  - Cache invalidation support with pattern matching.
  - Bulk operations, cache statistics, and graceful error handling.
  - Conditional caching (can be disabled via configuration).
- **API Response Standardization**:
  - Global response interceptor for consistent API responses.
  - Global exception filter for uniform error handling.
- **Configuration Management**:
  - Environment-based config files (default, development, production, test).
  - Centralized config loading with `@nestjs/config`.
- **Developer Experience**:
  - Ready-to-use example modules and DTOs.
  - Built-in validation and error messages.
  - Modular, extensible codebase for rapid feature development.

## Getting Started

### Prerequisites

- Node.js (v16+ recommended)
- MongoDB (local or remote)
- AWS account (for S3 integration, optional)

### Installation

```bash
git clone https://github.com/your-org/nestjs-blueprint.git
cd nestjs-blueprint
npm install
```

### Configuration

Copy `.env.example` to `.env` and update values as needed:

```bash
cp .env.example .env
```

Set up your MongoDB URI, JWT secrets, AWS credentials, etc.

#### Cache Configuration

The blueprint includes a comprehensive Redis-based caching system. Configure cache settings in your `.env` file:

```env
# Cache Configuration
CACHE_ENABLED=true
CACHE_DEFAULT_TTL=3600
CACHE_PREFIX=nestjs:

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0
REDIS_KEY_PREFIX=nestjs:
```

**Note**: Set `CACHE_ENABLED=false` to disable caching completely, useful for development or when Redis is unavailable.

### Running the App

```bash
npm run start:dev
```

The app will start on the port configured in your `.env` or `src/config/default.ts`.

## Project Structure

- `src/app.module.ts` – Main application module, imports all features.
- `src/common/` – Shared utilities, guards, interceptors, filters, helpers.
- `src/modules/` – Feature modules (auth, user, example).
- `src/config/` – Environment-specific configuration.
- `src/tracer.ts` – OpenTelemetry tracing setup.

## Extending the Blueprint

- Add new modules under `src/modules/`.
- Register new providers or services in the relevant module.
- Use the provided logger and HTTP connector for consistency.

### Using the Cache System

The blueprint provides a powerful caching system with decorators and manual control:

#### Automatic Caching with Decorators

```typescript
import { Injectable } from '@nestjs/common';
import { Cache, CacheInvalidate } from 'src/common/helpers/cache';

@Injectable()
export class UserService {
  @Cache({ ttl: 300, key: (userId: number) => `user:${userId}:profile` })
  async getUserProfile(userId: number) {
    return await this.fetchUserFromDatabase(userId);
  }

  @CacheInvalidate('user:*')
  async updateUser(userId: number, data: any) {
    return await this.updateUserInDatabase(userId, data);
  }
}
```

#### Manual Cache Control

```typescript
import { Injectable } from '@nestjs/common';
import { CacheService } from 'src/common/helpers/cache';

@Injectable()
export class DataService {
  constructor(private readonly cacheService: CacheService) {}

  async getDataWithCache(key: string) {
    return await this.cacheService.getOrSet(
      key,
      async () => await this.fetchData(),
      { ttl: 1800 }
    );
  }
}
```

For detailed cache documentation, see `src/common/helpers/cache/README.md`.

## Contributing

Contributions are welcome! Please open issues or pull requests.

## License

MIT
