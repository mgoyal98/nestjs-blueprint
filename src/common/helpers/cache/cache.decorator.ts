import { SetMetadata } from '@nestjs/common';

export interface CacheDecoratorOptions {
  ttl?: number;
  key?: string | ((...args: any[]) => string);
  prefix?: string;
}

export const CACHE_KEY_METADATA = 'cache_key_metadata';
export const CACHE_TTL_METADATA = 'cache_ttl_metadata';
export const CACHE_PREFIX_METADATA = 'cache_prefix_metadata';

/**
 * Decorator to mark a method for caching
 * @param options - Cache options
 */
export function Cache(options: CacheDecoratorOptions = {}) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    // Set metadata for the method
    SetMetadata(CACHE_KEY_METADATA, options.key || propertyKey)(
      target,
      propertyKey,
      descriptor,
    );
    SetMetadata(CACHE_TTL_METADATA, options.ttl)(
      target,
      propertyKey,
      descriptor,
    );
    SetMetadata(CACHE_PREFIX_METADATA, options.prefix)(
      target,
      propertyKey,
      descriptor,
    );

    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // This will be handled by the cache interceptor
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * Decorator to invalidate cache entries
 * @param pattern - Pattern to match keys for invalidation
 */
export function CacheInvalidate(pattern?: string) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    SetMetadata('cache_invalidate', pattern || '*')(
      target,
      propertyKey,
      descriptor,
    );

    return descriptor;
  };
}
