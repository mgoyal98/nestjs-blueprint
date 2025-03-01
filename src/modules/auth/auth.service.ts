import { Injectable } from '@nestjs/common';
import { AppLoggerService } from 'src/common/helpers/logger';
import { CreateUserDto, User, UserService } from 'src/modules/user';
import { LoginDto } from './auth.dto';
import { comparePassword } from 'src/common/utils/crypto';
import { EXCEPTION_MESSAGE, exceptionMapper } from 'src/common/exception';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly logger: AppLoggerService,
    private readonly configService: ConfigService,
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

  async login(user: LoginDto) {
    const logPrefix = this.logPrefix(this.login.name);
    try {
      this.logger.info(`${logPrefix} Login Request`);
      const result = await this.userService.findUserByEmail(user.email);

      if (!(await comparePassword(user.password, result.password))) {
        throw exceptionMapper(EXCEPTION_MESSAGE.INVALID_CREDENTIALS);
      }

      const tokenHeaders = await this.generateTokenAndHeaders(result);

      this.logger.info(`${logPrefix} Login Response`);

      return {
        data: result,
        setHeaders: tokenHeaders,
      };
    } catch (error) {
      this.logger.error(`${logPrefix} Login Error`, error);
      throw error;
    }
  }

  private async generateTokenAndHeaders(user: User) {
    const payload = {
      iss: this.configService.get('app.name'),
      sub: user.userId,
      email: user.email,
    };
    return {
      'x-access-token': this.jwtService.sign(payload),
    };
  }
}
