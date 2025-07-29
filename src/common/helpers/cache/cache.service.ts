import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string; // Key prefix
}

export interface CacheSetOptions extends CacheOptions {
  nx?: boolean; // Only set if key doesn't exist
  xx?: boolean; // Only set if key exists
}

@Injectable()
export class CacheService {
  private readonly redis: Redis | null;
  private readonly logger = new Logger(CacheService.name);
  private readonly defaultTTL: number;
  private readonly defaultPrefix: string;
  private readonly isEnabled: boolean;

  constructor(private readonly configService: ConfigService) {
    this.isEnabled =
      this.configService.get<boolean>('cache.isEnabled') || false;
    this.defaultTTL =
      this.configService.get<number>('cache.defaultTTL') || 3600; // 1 hour default
    this.defaultPrefix =
      this.configService.get<string>('cache.prefix') || 'nestjs:';

    this.redis = this.isEnabled ? this.createRedisClient() : null;

    if (!this.isEnabled) {
      this.logger.log(
        'Cache is disabled - Redis connection will not be established',
      );
    }
  }

  /**
   * Creates a Redis client instance with configuration from environment variables
   */
  private createRedisClient(): Redis {
    const host =
      this.configService.get<string>('cache.redis.host') || 'localhost';
    const port = this.configService.get<number>('cache.redis.port') || 6379;
    const password = this.configService.get<string>('cache.redis.password');
    const db = this.configService.get<number>('cache.redis.db') || 0;
    const keyPrefix =
      this.configService.get<string>('cache.redis.keyPrefix') || 'nestjs:';

    const config: RedisOptions = {
      host,
      port,
      db,
      keyPrefix,
    };

    if (password) {
      config.password = password;
    }

    const redis = new Redis(config);

    redis.on('connect', () => {
      this.logger.log('Connected to Redis');
    });

    redis.on('error', (error) => {
      this.logger.error('Redis connection error:', error);
    });

    redis.on('ready', () => {
      this.logger.log('Redis is ready');
    });

    return redis;
  }

  /**
   * Get a value from cache
   * @param key - Cache key
   * @param options - Cache options
   * @returns Promise<T | null> - The cached value or null if not found
   */
  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    if (!this.isEnabled || !this.redis) {
      return null;
    }

    try {
      const fullKey = this.buildKey(key, options?.prefix);
      const value = await this.redis.get(fullKey);

      if (value === null) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error(`Error getting cache key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set a value in cache
   * @param key - Cache key
   * @param value - Value to cache
   * @param options - Cache options
   * @returns Promise<boolean> - True if successful
   */
  async set<T>(
    key: string,
    value: T,
    options?: CacheSetOptions,
  ): Promise<boolean> {
    if (!this.isEnabled || !this.redis) {
      return false;
    }

    try {
      const fullKey = this.buildKey(key, options?.prefix);
      const ttl = options?.ttl ?? this.defaultTTL;
      const serializedValue = JSON.stringify(value);

      if (options?.nx) {
        const result = await this.redis.setnx(fullKey, serializedValue);
        if (result && ttl > 0) {
          await this.redis.expire(fullKey, ttl);
        }
        return result === 1;
      }

      if (options?.xx) {
        const exists = await this.redis.exists(fullKey);
        if (!exists) {
          return false;
        }
      }

      if (ttl > 0) {
        await this.redis.setex(fullKey, ttl, serializedValue);
      } else {
        await this.redis.set(fullKey, serializedValue);
      }

      return true;
    } catch (error) {
      this.logger.error(`Error setting cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete a value from cache
   * @param key - Cache key
   * @param options - Cache options
   * @returns Promise<boolean> - True if key was deleted
   */
  async delete(key: string, options?: CacheOptions): Promise<boolean> {
    if (!this.isEnabled || !this.redis) {
      return false;
    }

    try {
      const fullKey = this.buildKey(key, options?.prefix);
      const result = await this.redis.del(fullKey);
      return result > 0;
    } catch (error) {
      this.logger.error(`Error deleting cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * Check if a key exists in cache
   * @param key - Cache key
   * @param options - Cache options
   * @returns Promise<boolean> - True if key exists
   */
  async exists(key: string, options?: CacheOptions): Promise<boolean> {
    if (!this.isEnabled || !this.redis) {
      return false;
    }

    try {
      const fullKey = this.buildKey(key, options?.prefix);
      const result = await this.redis.exists(fullKey);
      return result > 0;
    } catch (error) {
      this.logger.error(`Error checking existence of cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get the TTL (time to live) of a key
   * @param key - Cache key
   * @param options - Cache options
   * @returns Promise<number> - TTL in seconds, -1 if no TTL, -2 if key doesn't exist
   */
  async ttl(key: string, options?: CacheOptions): Promise<number> {
    if (!this.isEnabled || !this.redis) {
      return -2;
    }

    try {
      const fullKey = this.buildKey(key, options?.prefix);
      return await this.redis.ttl(fullKey);
    } catch (error) {
      this.logger.error(`Error getting TTL for cache key ${key}:`, error);
      return -2;
    }
  }

  /**
   * Set TTL for a key
   * @param key - Cache key
   * @param ttl - Time to live in seconds
   * @param options - Cache options
   * @returns Promise<boolean> - True if TTL was set
   */
  async expire(
    key: string,
    ttl: number,
    options?: CacheOptions,
  ): Promise<boolean> {
    if (!this.isEnabled || !this.redis) {
      return false;
    }

    try {
      const fullKey = this.buildKey(key, options?.prefix);
      const result = await this.redis.expire(fullKey, ttl);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error setting TTL for cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get or set a value (cache-aside pattern)
   * @param key - Cache key
   * @param factory - Function to generate value if not in cache
   * @param options - Cache options
   * @returns Promise<T> - The cached or generated value
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options?: CacheSetOptions,
  ): Promise<T> {
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, options);
    return value;
  }

  /**
   * Increment a numeric value
   * @param key - Cache key
   * @param increment - Amount to increment (default: 1)
   * @param options - Cache options
   * @returns Promise<number> - New value after increment
   */
  async increment(
    key: string,
    increment: number = 1,
    options?: CacheOptions,
  ): Promise<number> {
    if (!this.isEnabled || !this.redis) {
      throw new Error('Cache is disabled');
    }

    try {
      const fullKey = this.buildKey(key, options?.prefix);
      return await this.redis.incrby(fullKey, increment);
    } catch (error) {
      this.logger.error(`Error incrementing cache key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Decrement a numeric value
   * @param key - Cache key
   * @param decrement - Amount to decrement (default: 1)
   * @param options - Cache options
   * @returns Promise<number> - New value after decrement
   */
  async decrement(
    key: string,
    decrement: number = 1,
    options?: CacheOptions,
  ): Promise<number> {
    if (!this.isEnabled || !this.redis) {
      throw new Error('Cache is disabled');
    }

    try {
      const fullKey = this.buildKey(key, options?.prefix);
      return await this.redis.decrby(fullKey, decrement);
    } catch (error) {
      this.logger.error(`Error decrementing cache key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Set multiple key-value pairs
   * @param entries - Array of key-value pairs
   * @param options - Cache options
   * @returns Promise<boolean> - True if successful
   */
  async mset<T>(
    entries: Array<{ key: string; value: T }>,
    options?: CacheSetOptions,
  ): Promise<boolean> {
    if (!this.isEnabled || !this.redis) {
      return false;
    }

    try {
      const pipeline = this.redis.pipeline();
      const ttl = options?.ttl ?? this.defaultTTL;

      for (const { key, value } of entries) {
        const fullKey = this.buildKey(key, options?.prefix);
        const serializedValue = JSON.stringify(value);

        if (ttl > 0) {
          pipeline.setex(fullKey, ttl, serializedValue);
        } else {
          pipeline.set(fullKey, serializedValue);
        }
      }

      await pipeline.exec();
      return true;
    } catch (error) {
      this.logger.error('Error setting multiple cache entries:', error);
      return false;
    }
  }

  /**
   * Get multiple values
   * @param keys - Array of keys to get
   * @param options - Cache options
   * @returns Promise<Array<T | null>> - Array of values (null for missing keys)
   */
  async mget<T>(
    keys: string[],
    options?: CacheOptions,
  ): Promise<Array<T | null>> {
    if (!this.isEnabled || !this.redis) {
      return keys.map(() => null);
    }

    try {
      const fullKeys = keys.map((key) => this.buildKey(key, options?.prefix));
      const values = await this.redis.mget(...fullKeys);

      return values.map((value) => {
        if (value === null) {
          return null;
        }
        try {
          return JSON.parse(value) as T;
        } catch {
          return null;
        }
      });
    } catch (error) {
      this.logger.error('Error getting multiple cache entries:', error);
      return keys.map(() => null);
    }
  }

  /**
   * Delete multiple keys
   * @param keys - Array of keys to delete
   * @param options - Cache options
   * @returns Promise<number> - Number of keys deleted
   */
  async mdelete(keys: string[], options?: CacheOptions): Promise<number> {
    if (!this.isEnabled || !this.redis) {
      return 0;
    }

    try {
      const fullKeys = keys.map((key) => this.buildKey(key, options?.prefix));
      return await this.redis.del(...fullKeys);
    } catch (error) {
      this.logger.error('Error deleting multiple cache entries:', error);
      return 0;
    }
  }

  /**
   * Clear all cache entries (use with caution)
   * @param pattern - Pattern to match keys (default: all keys with prefix)
   * @returns Promise<number> - Number of keys deleted
   */
  async clear(pattern?: string): Promise<number> {
    if (!this.isEnabled || !this.redis) {
      return 0;
    }

    try {
      const searchPattern = pattern || `${this.defaultPrefix}*`;
      const keys = await this.redis.keys(searchPattern);

      if (keys.length === 0) {
        return 0;
      }

      return await this.redis.del(...keys);
    } catch (error) {
      this.logger.error('Error clearing cache:', error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   * @returns Promise<object> - Cache statistics
   */
  async getStats(): Promise<{
    totalKeys: number;
    memoryUsage: string;
    connectedClients: number;
    uptime: number;
  }> {
    if (!this.isEnabled || !this.redis) {
      return {
        totalKeys: 0,
        memoryUsage: '0B',
        connectedClients: 0,
        uptime: 0,
      };
    }

    try {
      const info = await this.redis.info();
      const keys = await this.redis.dbsize();

      // Parse Redis INFO output
      const lines = info.split('\r\n');
      const stats: Record<string, string> = {};

      for (const line of lines) {
        const [key, value] = line.split(':');
        if (key && value) {
          stats[key] = value;
        }
      }

      return {
        totalKeys: keys,
        memoryUsage: stats.used_memory_human || '0B',
        connectedClients: parseInt(stats.connected_clients || '0'),
        uptime: parseInt(stats.uptime_in_seconds || '0'),
      };
    } catch (error) {
      this.logger.error('Error getting cache stats:', error);
      return {
        totalKeys: 0,
        memoryUsage: '0B',
        connectedClients: 0,
        uptime: 0,
      };
    }
  }

  /**
   * Build a full cache key with prefix
   * @param key - Base key
   * @param prefix - Optional prefix override
   * @returns string - Full cache key
   */
  private buildKey(key: string, prefix?: string): string {
    const keyPrefix = prefix || this.defaultPrefix;
    return `${keyPrefix}${key}`;
  }

  /**
   * Check if cache is enabled
   * @returns boolean - True if cache is enabled
   */
  isCacheEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Get the Redis client instance (for advanced operations)
   * @returns Redis | null - The Redis client instance or null if disabled
   */
  getRedisClient(): Redis | null {
    return this.redis;
  }

  /**
   * Close the Redis connection
   */
  async onModuleDestroy(): Promise<void> {
    if (this.redis && this.isEnabled) {
      await this.redis.quit();
      this.logger.log('Redis connection closed');
    }
  }
}
