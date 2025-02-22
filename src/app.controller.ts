import { Controller, Get, Param } from '@nestjs/common';
import { AppService } from './app.service';
import { AppLoggerService } from 'src/common/helpers/logger';
import { EXCEPTION_MESSAGE, exceptionMapper } from './common/exception';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly logger: AppLoggerService,
  ) {}

  @Get()
  getHello(): string {
    this.logger.info('Hello World!');
    return this.appService.getHello();
  }

  @Get('error/:id')
  getError(@Param('id') id: string): string {
    throw exceptionMapper(EXCEPTION_MESSAGE.USER_NOT_FOUND, {
      id,
    });
  }
}
