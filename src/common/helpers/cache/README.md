# Cache Module

A comprehensive caching module for NestJS applications using Redis (ioredis). This module provides both automatic and manual caching capabilities with support for TTL, key prefixes, and advanced Redis operations.

## Features

- **Conditional Caching**: Enable/disable cache functionality via configuration
- **Automatic Caching**: Use decorators to automatically cache method results
- **Manual Caching**: Direct access to cache service for custom caching logic
- **TTL Support**: Configurable time-to-live for cache entries
- **Key Prefixing**: Namespace cache keys to avoid conflicts
- **Bulk Operations**: Get, set, and delete multiple keys at once
- **Cache Statistics**: Monitor cache performance and usage
- **Error Handling**: Graceful error handling with logging
- **Type Safety**: Full TypeScript support

## Installation

The cache module is already included in the project. Make sure you have Redis running and configure the environment variables.

## Configuration

### Environment Variables

- `CACHE_ENABLED`: Set to `true` to enable cache functionality, `false` to disable (default: `false`)
- `CACHE_DEFAULT_TTL`: Default time-to-live for cache entries in seconds (default: `3600`)
- `CACHE_PREFIX`: Default prefix for cache keys (default: `nestjs:`)
- `REDIS_HOST`: Redis server host (default: `localhost`)
- `REDIS_PORT`: Redis server port (default: `6379`)
- `REDIS_PASSWORD`: Redis server password (optional)
- `REDIS_DB`: Redis database number (default: `0`)
- `REDIS_KEY_PREFIX`: Redis key prefix (default: `nestjs:`)

### Disabling Cache

To disable cache functionality completely, set `CACHE_ENABLED=false` in your environment variables. When disabled:

- No Redis connection will be established
- All cache operations will return appropriate default values
- The application will continue to function normally without caching
- This is useful for development, testing, or when Redis is not available

### Environment Variables Example

Add the following environment variables to your `.env` file:

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

## Usage

### 1. Automatic Caching with Decorators

Use the `@Cache()` decorator to automatically cache method results:

```typescript
import { Injectable } from '@nestjs/common';
import { Cache } from 'src/common/helpers/cache';

@Injectable()
export class UserService {
  @Cache({ ttl: 300, key: 'user-profile' }) // Cache for 5 minutes
  async getUserProfile(userId: number) {
    // This method result will be automatically cached
    return await this.fetchUserFromDatabase(userId);
  }

  @Cache({ 
    ttl: 1800, 
    key: (userId: number) => `user:${userId}:profile` // Dynamic key
  })
  async getUserProfileWithDynamicKey(userId: number) {
    return await this.fetchUserFromDatabase(userId);
  }
}
```

### 2. Manual Caching

Inject the `CacheService` for manual cache operations:

```typescript
import { Injectable } from '@nestjs/common';
import { CacheService } from 'src/common/helpers/cache';

@Injectable()
export class DataService {
  constructor(private readonly cacheService: CacheService) {}

  async getDataWithManualCache(key: string) {
    // Try to get from cache first
    const cached = await this.cacheService.get(key);
    if (cached) {
      return cached;
    }

    // Fetch fresh data
    const data = await this.fetchData();
    
    // Cache the result
    await this.cacheService.set(key, data, { ttl: 600 });
    
    return data;
  }

  async getDataWithGetOrSet(key: string) {
    return await this.cacheService.getOrSet(
      key,
      async () => {
        // This function is only called if the key doesn't exist in cache
        return await this.fetchData();
      },
      { ttl: 1800 }
    );
  }
}
```

### 3. Cache Invalidation

Use the `@CacheInvalidate()` decorator to invalidate cache entries:

```typescript
import { Injectable } from '@nestjs/common';
import { CacheInvalidate } from 'src/common/helpers/cache';

@Injectable()
export class UserService {
  @CacheInvalidate('user:*') // Invalidate all user-related cache entries
  async updateUser(userId: number, data: any) {
    // After this method executes, all cache entries matching 'user:*' will be deleted
    return await this.updateUserInDatabase(userId, data);
  }
}
```

## API Reference

### CacheService Methods

#### Basic Operations

- `get<T>(key: string, options?: CacheOptions): Promise<T | null>`
- `set<T>(key: string, value: T, options?: CacheSetOptions): Promise<boolean>`
- `delete(key: string, options?: CacheOptions): Promise<boolean>`
- `exists(key: string, options?: CacheOptions): Promise<boolean>`

#### Advanced Operations

- `getOrSet<T>(key: string, factory: () => Promise<T>, options?: CacheSetOptions): Promise<T>`
- `increment(key: string, increment?: number, options?: CacheOptions): Promise<number>`
- `decrement(key: string, decrement?: number, options?: CacheOptions): Promise<number>`

#### Bulk Operations

- `mget<T>(keys: string[], options?: CacheOptions): Promise<Array<T | null>>`
- `mset<T>(entries: Array<{key: string, value: T}>, options?: CacheSetOptions): Promise<boolean>`
- `mdelete(keys: string[], options?: CacheOptions): Promise<number>`

#### Utility Methods

- `isCacheEnabled(): boolean` - Check if cache is enabled
- `ttl(key: string, options?: CacheOptions): Promise<number>`
- `expire(key: string, ttl: number, options?: CacheOptions): Promise<boolean>`
- `clear(pattern?: string): Promise<number>`
- `getStats(): Promise<object>`

### Cache Options

```typescript
interface CacheOptions {
  ttl?: number;      // Time to live in seconds
  prefix?: string;   // Key prefix
}

interface CacheSetOptions extends CacheOptions {
  nx?: boolean;      // Only set if key doesn't exist
  xx?: boolean;      // Only set if key exists
}
```

### Decorator Options

```typescript
interface CacheDecoratorOptions {
  ttl?: number;                                    // TTL in seconds
  key?: string | ((...args: any[]) => string);    // Cache key or function
  prefix?: string;                                 // Key prefix
}
```

## Examples

### Example 1: Caching API Responses

```typescript
@Injectable()
export class ExternalApiService {
  constructor(private readonly cacheService: CacheService) {}

  @Cache({ ttl: 3600, key: 'weather-data' })
  async getWeatherData(city: string) {
    return await this.fetchFromWeatherApi(city);
  }
}
```

### Example 2: Database Query Caching

```typescript
@Injectable()
export class ProductService {
  @Cache({ ttl: 1800, key: (id: number) => `product:${id}` })
  async getProductById(id: number) {
    return await this.productRepository.findById(id);
  }

  @CacheInvalidate('product:*')
  async updateProduct(id: number, data: any) {
    const result = await this.productRepository.update(id, data);
    // This will invalidate all product cache entries
    return result;
  }
}
```

### Example 3: Rate Limiting with Cache

```typescript
@Injectable()
export class RateLimitService {
  constructor(private readonly cacheService: CacheService) {}

  async checkRateLimit(userId: string, limit: number, window: number): Promise<boolean> {
    const key = `rate_limit:${userId}`;
    const current = await this.cacheService.increment(key);
    
    if (current === 1) {
      await this.cacheService.expire(key, window);
    }
    
    return current <= limit;
  }
}
```

### Example 4: Checking Cache Status

```typescript
@Injectable()
export class DataService {
  constructor(private readonly cacheService: CacheService) {}

  async getDataWithCacheCheck(key: string) {
    // Check if cache is enabled before using it
    if (this.cacheService.isCacheEnabled()) {
      const cached = await this.cacheService.get(key);
      if (cached) {
        return cached;
      }
    }

    // Fetch fresh data
    const data = await this.fetchData();
    
    // Cache the result if cache is enabled
    if (this.cacheService.isCacheEnabled()) {
      await this.cacheService.set(key, data, { ttl: 600 });
    }
    
    return data;
  }
}
```

## Error Handling

The cache service includes comprehensive error handling:

- Connection errors are logged but don't crash the application
- Failed cache operations return sensible defaults (null, false, etc.)
- All errors are logged with context for debugging

## Monitoring

Use the `getStats()` method to monitor cache performance:

```typescript
const stats = await this.cacheService.getStats();
console.log('Cache Stats:', stats);
// Output: { totalKeys: 150, memoryUsage: '2.5MB', connectedClients: 3, uptime: 86400 }
```

## Best Practices

1. **Use Appropriate TTL**: Set TTL based on data freshness requirements
2. **Key Naming**: Use descriptive, hierarchical keys (e.g., `user:123:profile`)
3. **Error Handling**: Always handle cache failures gracefully
4. **Monitoring**: Monitor cache hit rates and memory usage
5. **Invalidation**: Use cache invalidation when data changes
6. **Bulk Operations**: Use bulk operations for better performance

## Troubleshooting

### Common Issues

1. **Redis Connection Failed**: Check Redis server is running and credentials are correct
2. **Cache Not Working**: Verify the CacheModule is imported in your AppModule and `CACHE_ENABLED=true`
3. **Cache Disabled**: If cache operations return null/false, check if `CACHE_ENABLED` is set to `true`
4. **Memory Issues**: Monitor Redis memory usage and adjust TTL settings
5. **Performance Issues**: Use bulk operations and appropriate key patterns

### Debug Mode

Enable debug logging to see cache operations:

```typescript
// In your logger configuration
logger: {
  debug: true,
}
```

## Dependencies

- `ioredis`: Redis client for Node.js
- `@nestjs/common`: NestJS core functionality
- `@nestjs/config`: Configuration management 