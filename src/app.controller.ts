import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { AppLoggerService } from 'src/common/helpers/logger';

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
}
