import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ClsService } from 'nestjs-cls';
import { ContextKey } from 'src/common/enums';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly cls: ClsService,
  ) {}

  @Get()
  getHello(): string {
    const correlationId = this.cls.get(ContextKey.CORRELATION_ID);
    console.log(`correlationId: ${correlationId}`);
    return this.appService.getHello();
  }
}
