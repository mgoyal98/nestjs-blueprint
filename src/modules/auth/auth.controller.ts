import { Body, Controller, Post, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from 'src/modules/user';
import { AppLoggerService } from 'src/common/helpers/logger';
import { LoginDto } from './auth.dto';
import { HeaderKey } from 'src/common/enums';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: AppLoggerService,
  ) {}

  private logPrefix(funcName: string) {
    return `[${this.constructor.name}.${funcName}]`;
  }

  @Post('signup')
  async signup(@Body() user: CreateUserDto) {
    const logPrefix = this.logPrefix(this.signup.name);
    this.logger.info(`${logPrefix} Sign Up Request`);
    const result = await this.authService.signUp(user);
    this.logger.info(`${logPrefix} Sign Up Response`);
    return result;
  }

  @Post('login')
  async login(@Body() user: LoginDto) {
    const logPrefix = this.logPrefix(this.login.name);
    this.logger.info(`${logPrefix} Login Request`);
    const result = await this.authService.login(user);
    this.logger.info(`${logPrefix} Login Response`);
    return result;
  }

  @Post('refresh-token')
  async refreshToken(@Req() req: Request) {
    const logPrefix = this.logPrefix(this.refreshToken.name);
    this.logger.info(`${logPrefix} Refresh Token Request`);
    const result = await this.authService.refreshToken(
      req.headers[HeaderKey.REFRESH_TOKEN],
    );
    this.logger.info(`${logPrefix} Refresh Token Response`);
    return result;
  }
}
