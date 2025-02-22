import { Injectable } from '@nestjs/common';
import {
  HttpConnectorService,
  HttpMethod,
} from 'src/common/helpers/http-connector';
import { AppLoggerService } from 'src/common/helpers/logger';

@Injectable()
export class ExampleService {
  constructor(
    private readonly httpConnectorService: HttpConnectorService,
    private readonly logger: AppLoggerService,
  ) {}

  private logPrefix(funcName: string) {
    return `[${this.constructor.name}.${funcName}]`;
  }

  async getExample() {
    const logPrefix = this.logPrefix(this.getExample.name);
    this.logger.info(`${logPrefix} Get Example`);
    return 'Example Api';
  }

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
}
