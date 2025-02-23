import { Controller, Get } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './db';
import { AppLoggerService } from 'src/common/helpers/logger';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly logger: AppLoggerService,
  ) {}

  private logPrefix(funcName: string) {
    return `[${this.constructor.name}.${funcName}]`;
  }

  @Get()
  async findAllUsers(): Promise<User[]> {
    const logPrefix = this.logPrefix(this.findAllUsers.name);
    this.logger.info(`${logPrefix} Find All Users Request`);
    const result = await this.userService.findAllUsers();
    this.logger.info(`${logPrefix} Find All Users Response`, { result });
    return result;
  }
}
