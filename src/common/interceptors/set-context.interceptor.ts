import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { ContextKey } from 'src/common/enums';
import { HeaderKey } from '../enums/header-key.enum';

@Injectable()
export class SetContextInterceptor implements NestInterceptor {
  constructor(
    private readonly cls: ClsService,
    private readonly configService: ConfigService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const headers = request.headers;

    const appName = this.configService.get('app.name');

    let correlationId = headers[HeaderKey.CORRELATION_ID];
    if (!correlationId) {
      correlationId = `${appName}-${uuidv4()}`;
    }

    this.cls.set(ContextKey.CORRELATION_ID, correlationId);

    return next.handle();
  }
}
