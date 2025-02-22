import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { HeaderKey } from 'src/common/enums';
import { exceptionMapper, EXCEPTION_MESSAGE } from 'src/common/exception';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers[HeaderKey.API_KEY];
    if (!apiKey) {
      throw exceptionMapper(EXCEPTION_MESSAGE.API_KEY_REQUIRED);
    }
    if (!this.configService.get('auth.apiKeys').includes(apiKey)) {
      throw exceptionMapper(EXCEPTION_MESSAGE.INVALID_API_KEY);
    }
    return true;
  }
}
