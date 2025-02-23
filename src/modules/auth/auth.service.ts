import { Injectable } from '@nestjs/common';
import { AppLoggerService } from 'src/common/helpers/logger';
import { CreateUserDto, UserService } from 'src/modules/user';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly logger: AppLoggerService,
  ) {}

  private logPrefix(funcName: string) {
    return `[${this.constructor.name}.${funcName}]`;
  }

  async signUp(user: CreateUserDto) {
    const logPrefix = this.logPrefix(this.signUp.name);
    try {
      this.logger.info(`${logPrefix} Sign Up Request`);
      const result = await this.userService.createUser(user);
      this.logger.info(`${logPrefix} Sign Up Response`);
      return result;
    } catch (error) {
      this.logger.error(`${logPrefix} Sign Up Error`, { error });
      throw error;
    }
  }
}
