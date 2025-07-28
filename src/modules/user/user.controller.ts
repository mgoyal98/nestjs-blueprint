import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './db';
import { AppLoggerService } from 'src/common/helpers/logger';
import { ContextKey } from 'src/common/enums';
import { ClsService } from 'nestjs-cls';
import { AuthGuard } from 'src/common/guards';
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly logger: AppLoggerService,
    private readonly cls: ClsService,
  ) {}

  private logPrefix(funcName: string) {
    return `[${this.constructor.name}.${funcName}]`;
  }

  @Get()
  async findAllUsers(): Promise<User[]> {
    const logPrefix = this.logPrefix(this.findAllUsers.name);
    this.logger.debug(`${logPrefix} Find All Users Request`);
    const result = await this.userService.findAllUsers();
    this.logger.debug(`${logPrefix} Find All Users Response`, { result });
    return result;
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async getMe(): Promise<User> {
    const logPrefix = this.logPrefix(this.getMe.name);
    const userId = this.cls.get(ContextKey.USER_ID);
    this.logger.debug(`${logPrefix} Get Me Request`, { userId });
    const result = await this.userService.findUserById(userId);
    this.logger.debug(`${logPrefix} Get Me Response`, { result });
    return result;
  }
}
