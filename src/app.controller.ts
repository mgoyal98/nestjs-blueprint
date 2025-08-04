import { Controller, Get, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  @Get('keys')
  getKeys(@Res() res: Response) {
    const keys = this.appService.getKeys();
    res.json(keys);
  }
}
