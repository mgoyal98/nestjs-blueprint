import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ExampleService } from './example.service';
import { AppLoggerService } from 'src/common/helpers/logger';
import { exceptionMapper, EXCEPTION_MESSAGE } from 'src/common/exception';
import { ApiKeyGuard } from 'src/common/guards';

@Controller('example')
export class ExampleController {
  constructor(
    private readonly exampleService: ExampleService,
    private readonly logger: AppLoggerService,
  ) {}

  private logPrefix(funcName: string) {
    return `[${this.constructor.name}.${funcName}]`;
  }

  @Get()
  async getExample() {
    const logPrefix = this.logPrefix(this.getExample.name);
    try {
      this.logger.debug(`${logPrefix} Get Example Request`);
      const result = await this.exampleService.getExample();
      this.logger.debug(`${logPrefix} Get Example Response`, {
        result,
      });
      return result;
    } catch (error) {
      this.logger.error(`${logPrefix} Get Example Failed`, error);
      throw error;
    }
  }

  @Get('error/:id')
  getError(@Param('id') id: string): string {
    throw exceptionMapper(EXCEPTION_MESSAGE.USER_NOT_FOUND_WITH_ID, {
      id,
    });
  }

  @Get('remote')
  async getRemoteUsers() {
    const logPrefix = this.logPrefix(this.getRemoteUsers.name);
    try {
      this.logger.debug(`${logPrefix} Get Remote Users Request`);
      const result = await this.exampleService.getRemoteUsers();
      this.logger.debug(`${logPrefix} Get Remote Users Response`, {
        result,
      });
      return result;
    } catch (error) {
      this.logger.error(`${logPrefix} Get Remote Users Failed`, error);
      throw error;
    }
  }

  @Get('api-key')
  @UseGuards(ApiKeyGuard)
  getApiKey() {
    return 'API key is valid';
  }
}
