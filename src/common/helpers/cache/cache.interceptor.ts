import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from './cache.service';
import {
  CACHE_KEY_METADATA,
  CACHE_TTL_METADATA,
  CACHE_PREFIX_METADATA,
} from './cache.decorator';

type CacheKeyFunction = (...args: any[]) => string;

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const handler = context.getHandler();
    const cacheKey = this.reflector.get<string | CacheKeyFunction>(
      CACHE_KEY_METADATA,
      handler,
    );
    const cacheTTL = this.reflector.get<number>(CACHE_TTL_METADATA, handler);
    const cachePrefix = this.reflector.get<string>(
      CACHE_PREFIX_METADATA,
      handler,
    );

    // If no cache metadata, proceed normally
    if (!cacheKey) {
      return next.handle();
    }

    // Generate cache key
    const key = this.generateCacheKey(cacheKey, context);

    // Try to get from cache first
    const cachedValue = await this.cacheService.get(key, {
      prefix: cachePrefix,
    });

    if (cachedValue !== null) {
      this.logger.debug(`Cache hit for key: ${key}`);
      return of(cachedValue);
    }

    // If not in cache, execute the method and cache the result
    this.logger.debug(`Cache miss for key: ${key}`);
    return next.handle().pipe(
      tap(async (data) => {
        try {
          await this.cacheService.set(key, data, {
            ttl: cacheTTL,
            prefix: cachePrefix,
          });
          this.logger.debug(`Cached result for key: ${key}`);
        } catch (error) {
          this.logger.error(`Failed to cache result for key: ${key}`, error);
        }
      }),
    );
  }

  private generateCacheKey(
    key: string | CacheKeyFunction,
    context: ExecutionContext,
  ): string {
    if (typeof key === 'function') {
      const args = context.getArgs();
      return key(...args);
    }

    // Generate key based on method name and arguments
    const methodName = context.getHandler().name;
    const args = context.getArgs();
    const argsHash = this.hashArgs(args);

    return `${key}:${methodName}:${argsHash}`;
  }

  private hashArgs(args: any[]): string {
    try {
      return JSON.stringify(args)
        .replace(/[^a-zA-Z0-9]/g, '')
        .substring(0, 32);
    } catch {
      return 'default';
    }
  }
}
