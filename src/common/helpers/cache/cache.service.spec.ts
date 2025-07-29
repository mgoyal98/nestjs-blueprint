import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';

describe('CacheService', () => {
  let service: CacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                'cache.isEnabled': true,
                'cache.defaultTTL': 3600,
                'cache.prefix': 'test:',
                'cache.redis.host': 'localhost',
                'cache.redis.port': 6379,
                'cache.redis.db': 0,
                'cache.redis.keyPrefix': 'test:',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('basic operations', () => {
    it('should set and get a value', async () => {
      const key = 'test-key';
      const value = { data: 'test-value' };

      // Mock Redis operations
      const mockRedis = {
        get: jest.fn().mockResolvedValue(JSON.stringify(value)),
        set: jest.fn().mockResolvedValue('OK'),
        setex: jest.fn().mockResolvedValue('OK'),
        del: jest.fn().mockResolvedValue(1),
        exists: jest.fn().mockResolvedValue(1),
        ttl: jest.fn().mockResolvedValue(3600),
        expire: jest.fn().mockResolvedValue(1),
        incrby: jest.fn().mockResolvedValue(1),
        decrby: jest.fn().mockResolvedValue(0),
        mget: jest.fn().mockResolvedValue([JSON.stringify(value), null]),
        mset: jest.fn().mockResolvedValue(['OK', 'OK']),
        pipeline: jest.fn().mockReturnValue({
          setex: jest.fn().mockReturnThis(),
          set: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue([['OK'], ['OK']]),
        }),
        info: jest
          .fn()
          .mockResolvedValue(
            'used_memory_human:1.0M\r\nconnected_clients:1\r\nuptime_in_seconds:3600',
          ),
        dbsize: jest.fn().mockResolvedValue(10),
        keys: jest.fn().mockResolvedValue(['test:key1', 'test:key2']),
        quit: jest.fn().mockResolvedValue('OK'),
      };

      // Replace the Redis client with mock
      (service as any).redis = mockRedis;

      // Test set operation
      const setResult = await service.set(key, value, { ttl: 300 });
      expect(setResult).toBe(true);
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'test:test-key',
        300,
        JSON.stringify(value),
      );

      // Test get operation
      const getResult = await service.get(key);
      expect(getResult).toEqual(value);
      expect(mockRedis.get).toHaveBeenCalledWith('test:test-key');
    });

    it('should return null for non-existent key', async () => {
      const key = 'non-existent-key';
      const mockRedis = {
        get: jest.fn().mockResolvedValue(null),
      };
      (service as any).redis = mockRedis;

      const result = await service.get(key);
      expect(result).toBeNull();
    });

    it('should delete a key', async () => {
      const key = 'test-key';
      const mockRedis = {
        del: jest.fn().mockResolvedValue(1),
      };
      (service as any).redis = mockRedis;

      const result = await service.delete(key);
      expect(result).toBe(true);
      expect(mockRedis.del).toHaveBeenCalledWith('test:test-key');
    });

    it('should check if key exists', async () => {
      const key = 'test-key';
      const mockRedis = {
        exists: jest.fn().mockResolvedValue(1),
      };
      (service as any).redis = mockRedis;

      const result = await service.exists(key);
      expect(result).toBe(true);
      expect(mockRedis.exists).toHaveBeenCalledWith('test:test-key');
    });
  });

  describe('advanced operations', () => {
    it('should get or set a value', async () => {
      const key = 'test-key';
      const value = { data: 'test-value' };
      const factory = jest.fn().mockResolvedValue(value);

      const mockRedis = {
        get: jest.fn().mockResolvedValue(null),
        setex: jest.fn().mockResolvedValue('OK'),
      };
      (service as any).redis = mockRedis;

      const result = await service.getOrSet(key, factory, { ttl: 300 });
      expect(result).toEqual(value);
      expect(factory).toHaveBeenCalled();
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'test:test-key',
        300,
        JSON.stringify(value),
      );
    });

    it('should increment a value', async () => {
      const key = 'counter';
      const mockRedis = {
        incrby: jest.fn().mockResolvedValue(2),
      };
      (service as any).redis = mockRedis;

      const result = await service.increment(key, 1);
      expect(result).toBe(2);
      expect(mockRedis.incrby).toHaveBeenCalledWith('test:counter', 1);
    });

    it('should decrement a value', async () => {
      const key = 'counter';
      const mockRedis = {
        decrby: jest.fn().mockResolvedValue(1),
      };
      (service as any).redis = mockRedis;

      const result = await service.decrement(key, 1);
      expect(result).toBe(1);
      expect(mockRedis.decrby).toHaveBeenCalledWith('test:counter', 1);
    });
  });

  describe('bulk operations', () => {
    it('should get multiple values', async () => {
      const keys = ['key1', 'key2'];
      const values = [{ data: 'value1' }, null];
      const mockRedis = {
        mget: jest.fn().mockResolvedValue([JSON.stringify(values[0]), null]),
      };
      (service as any).redis = mockRedis;

      const result = await service.mget(keys);
      expect(result).toEqual(values);
      expect(mockRedis.mget).toHaveBeenCalledWith('test:key1', 'test:key2');
    });

    it('should set multiple values', async () => {
      const entries = [
        { key: 'key1', value: { data: 'value1' } },
        { key: 'key2', value: { data: 'value2' } },
      ];
      const mockRedis = {
        pipeline: jest.fn().mockReturnValue({
          setex: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue([['OK'], ['OK']]),
        }),
      };
      (service as any).redis = mockRedis;

      const result = await service.mset(entries);
      expect(result).toBe(true);
    });

    it('should delete multiple keys', async () => {
      const keys = ['key1', 'key2'];
      const mockRedis = {
        del: jest.fn().mockResolvedValue(2),
      };
      (service as any).redis = mockRedis;

      const result = await service.mdelete(keys);
      expect(result).toBe(2);
      expect(mockRedis.del).toHaveBeenCalledWith('test:key1', 'test:key2');
    });
  });

  describe('utility methods', () => {
    it('should get TTL of a key', async () => {
      const key = 'test-key';
      const mockRedis = {
        ttl: jest.fn().mockResolvedValue(300),
      };
      (service as any).redis = mockRedis;

      const result = await service.ttl(key);
      expect(result).toBe(300);
      expect(mockRedis.ttl).toHaveBeenCalledWith('test:test-key');
    });

    it('should set TTL for a key', async () => {
      const key = 'test-key';
      const mockRedis = {
        expire: jest.fn().mockResolvedValue(1),
      };
      (service as any).redis = mockRedis;

      const result = await service.expire(key, 300);
      expect(result).toBe(true);
      expect(mockRedis.expire).toHaveBeenCalledWith('test:test-key', 300);
    });

    it('should get cache statistics', async () => {
      const mockRedis = {
        info: jest
          .fn()
          .mockResolvedValue(
            'used_memory_human:1.0M\r\nconnected_clients:1\r\nuptime_in_seconds:3600',
          ),
        dbsize: jest.fn().mockResolvedValue(10),
      };
      (service as any).redis = mockRedis;

      const result = await service.getStats();
      expect(result).toEqual({
        totalKeys: 10,
        memoryUsage: '1.0M',
        connectedClients: 1,
        uptime: 3600,
      });
    });

    it('should clear cache entries', async () => {
      const mockRedis = {
        keys: jest.fn().mockResolvedValue(['test:key1', 'test:key2']),
        del: jest.fn().mockResolvedValue(2),
      };
      (service as any).redis = mockRedis;

      const result = await service.clear();
      expect(result).toBe(2);
      expect(mockRedis.keys).toHaveBeenCalledWith('test:*');
      expect(mockRedis.del).toHaveBeenCalledWith('test:key1', 'test:key2');
    });
  });

  describe('error handling', () => {
    it('should handle Redis errors gracefully', async () => {
      const key = 'test-key';
      const mockRedis = {
        get: jest.fn().mockRejectedValue(new Error('Redis connection failed')),
      };
      (service as any).redis = mockRedis;

      const result = await service.get(key);
      expect(result).toBeNull();
    });

    it('should handle JSON parsing errors', async () => {
      const key = 'test-key';
      const mockRedis = {
        get: jest.fn().mockResolvedValue('invalid-json'),
      };
      (service as any).redis = mockRedis;

      const result = await service.get(key);
      expect(result).toBeNull();
    });
  });

  describe('cache disabled functionality', () => {
    let disabledService: CacheService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          CacheService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                const config = {
                  'cache.isEnabled': false,
                  'cache.defaultTTL': 3600,
                  'cache.prefix': 'test:',
                  'cache.redis.host': 'localhost',
                  'cache.redis.port': 6379,
                  'cache.redis.db': 0,
                  'cache.redis.keyPrefix': 'test:',
                };
                return config[key];
              }),
            },
          },
        ],
      }).compile();

      disabledService = module.get<CacheService>(CacheService);
    });

    it('should return false for isCacheEnabled when disabled', () => {
      expect(disabledService.isCacheEnabled()).toBe(false);
    });

    it('should return null for get when cache is disabled', async () => {
      const result = await disabledService.get('test-key');
      expect(result).toBeNull();
    });

    it('should return false for set when cache is disabled', async () => {
      const result = await disabledService.set('test-key', { data: 'test' });
      expect(result).toBe(false);
    });

    it('should return false for delete when cache is disabled', async () => {
      const result = await disabledService.delete('test-key');
      expect(result).toBe(false);
    });

    it('should return false for exists when cache is disabled', async () => {
      const result = await disabledService.exists('test-key');
      expect(result).toBe(false);
    });

    it('should return -2 for ttl when cache is disabled', async () => {
      const result = await disabledService.ttl('test-key');
      expect(result).toBe(-2);
    });

    it('should return false for expire when cache is disabled', async () => {
      const result = await disabledService.expire('test-key', 300);
      expect(result).toBe(false);
    });

    it('should return factory value for getOrSet when cache is disabled', async () => {
      const factory = jest.fn().mockResolvedValue({ data: 'test' });
      const result = await disabledService.getOrSet('test-key', factory);
      expect(result).toEqual({ data: 'test' });
      expect(factory).toHaveBeenCalled();
    });

    it('should throw error for increment when cache is disabled', async () => {
      await expect(disabledService.increment('test-key')).rejects.toThrow(
        'Cache is disabled',
      );
    });

    it('should throw error for decrement when cache is disabled', async () => {
      await expect(disabledService.decrement('test-key')).rejects.toThrow(
        'Cache is disabled',
      );
    });

    it('should return array of nulls for mget when cache is disabled', async () => {
      const result = await disabledService.mget(['key1', 'key2']);
      expect(result).toEqual([null, null]);
    });

    it('should return false for mset when cache is disabled', async () => {
      const result = await disabledService.mset([
        { key: 'key1', value: { data: 'test1' } },
        { key: 'key2', value: { data: 'test2' } },
      ]);
      expect(result).toBe(false);
    });

    it('should return 0 for mdelete when cache is disabled', async () => {
      const result = await disabledService.mdelete(['key1', 'key2']);
      expect(result).toBe(0);
    });

    it('should return 0 for clear when cache is disabled', async () => {
      const result = await disabledService.clear();
      expect(result).toBe(0);
    });

    it('should return default stats when cache is disabled', async () => {
      const result = await disabledService.getStats();
      expect(result).toEqual({
        totalKeys: 0,
        memoryUsage: '0B',
        connectedClients: 0,
        uptime: 0,
      });
    });

    it('should return null for getRedisClient when cache is disabled', () => {
      const result = disabledService.getRedisClient();
      expect(result).toBeNull();
    });
  });
});
