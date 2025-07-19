import { Injectable } from '@nestjs/common';
import { AppLoggerService } from 'src/common/helpers/logger';
import { CreateUserDto, User, UserService } from 'src/modules/user';
import { LoginDto } from './auth.dto';
import { comparePassword } from 'src/common/utils/crypto';
import { EXCEPTION_MESSAGE, exceptionMapper } from 'src/common/exception';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { HeaderKey } from 'src/common/enums';

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

      const tokenHeaders = await this.generateTokensAndHeaders(result);

      this.logger.info(`${logPrefix} Login Response`);

      return {
        data: result,
        headers: tokenHeaders,
      };
    } catch (error) {
      this.logger.error(`${logPrefix} Login Error`, error);
      throw error;
    }
  }

  async refreshToken(headerRefreshToken: string) {
    const logPrefix = this.logPrefix(this.refreshToken.name);
    try {
      this.logger.info(`${logPrefix} Refresh Token Request`);

      if (!headerRefreshToken) {
        throw exceptionMapper(EXCEPTION_MESSAGE.INVALID_REFRESH_TOKEN);
      }

      // Verify the refresh token
      let payload: Record<string, any>;
      try {
        payload = await this.jwtService.verifyAsync(headerRefreshToken, {
          secret: this.configService.get('auth.jwt.refreshTokenSecret'),
        });
      } catch (error) {
        this.logger.error(`${logPrefix} Refresh Token Error`, error);
        throw exceptionMapper(EXCEPTION_MESSAGE.INVALID_REFRESH_TOKEN);
      }

      // Get the user
      const user = await this.userService.findUserById(payload.sub);

      // Generate new tokens
      const tokenHeaders = await this.generateTokensAndHeaders(user);

      this.logger.info(`${logPrefix} Refresh Token Response`);

      return {
        data: {},
        headers: tokenHeaders,
      };
    } catch (error) {
      this.logger.error(`${logPrefix} Refresh Token Error`, error);
      throw error;
    }
  }

  private async generateTokensAndHeaders(user: User) {
    const payload = {
      iss: this.configService.get('app.name'),
      sub: user.userId,
      email: user.email,
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = this.jwtService.sign(
      { sub: user.userId, iss: this.configService.get('app.name') },
      {
        expiresIn: this.configService.get('auth.jwt.refreshTokenExpiry'),
        secret: this.configService.get('auth.jwt.refreshTokenSecret'),
      },
    );

    return {
      [HeaderKey.ACCESS_TOKEN]: accessToken,
      [HeaderKey.REFRESH_TOKEN]: refreshToken,
    };
  }
}
