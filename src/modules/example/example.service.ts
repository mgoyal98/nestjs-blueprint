import { Injectable } from '@nestjs/common';
import {
  HttpConnectorService,
  HttpMethod,
} from 'src/common/helpers/http-connector';
import { AppLoggerService } from 'src/common/helpers/logger';
import { CacheService, Cache } from 'src/common/helpers/cache';

@Injectable()
export class ExampleService {
  constructor(
    private readonly httpConnectorService: HttpConnectorService,
    private readonly logger: AppLoggerService,
    private readonly cacheService: CacheService,
  ) {}

  private logPrefix(funcName: string) {
    return `[${this.constructor.name}.${funcName}]`;
  }

  async getExample() {
    const logPrefix = this.logPrefix(this.getExample.name);
    this.logger.info(`${logPrefix} Get Example`);
    return 'Example Api';
  }

  @Cache({ ttl: 300, key: 'remote-users' }) // Cache for 5 minutes
  async getRemoteUsers() {
    const logPrefix = this.logPrefix(this.getRemoteUsers.name);
    try {
      this.logger.info(`${logPrefix} Get Remote Users`);
      const result = await this.httpConnectorService.request({
        method: HttpMethod.GET,
        url: 'https://reqres.in/api/users',
      });
      return result;
    } catch (error) {
      this.logger.error(`${logPrefix} Get Remote Users Failed`, error);
      throw error;
    }
  }

  async getRemoteUsersWithManualCache() {
    const logPrefix = this.logPrefix(this.getRemoteUsersWithManualCache.name);
    const cacheKey = 'remote-users-manual';

    // Try to get from cache first
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      this.logger.info(`${logPrefix} Returning cached data`);
      return cached;
    }

    try {
      this.logger.info(`${logPrefix} Fetching fresh data`);
      const result = await this.httpConnectorService.request({
        method: HttpMethod.GET,
        url: 'https://reqres.in/api/users',
      });

      // Cache the result for 10 minutes
      await this.cacheService.set(cacheKey, result, { ttl: 600 });

      return result;
    } catch (error) {
      this.logger.error(`${logPrefix} Get Remote Users Failed`, error);
      throw error;
    }
  }

  async getCachedUserById(userId: number) {
    const logPrefix = this.logPrefix(this.getCachedUserById.name);
    const cacheKey = `user:${userId}`;

    return await this.cacheService.getOrSet(
      cacheKey,
      async () => {
        this.logger.info(`${logPrefix} Fetching user ${userId} from API`);
        const result = await this.httpConnectorService.request({
          method: HttpMethod.GET,
          url: `https://reqres.in/api/users/${userId}`,
        });
        return result;
      },
      { ttl: 1800 }, // Cache for 30 minutes
    );
  }
}
