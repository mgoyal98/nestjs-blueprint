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
import { ContextKey, HeaderKey } from 'src/common/enums';

import { trace } from '@opentelemetry/api';

@Injectable()
export class SetContextInterceptor implements NestInterceptor {
  constructor(
    private readonly cls: ClsService,
    private readonly configService: ConfigService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const headers = request.headers;

    const span = trace.getActiveSpan();

    const appName = this.configService.get('app.name');

    let correlationId = headers[HeaderKey.CORRELATION_ID];
    if (!correlationId) {
      correlationId = `${appName}-${uuidv4()}`;
    }
    span?.setAttribute('request.correlationId', correlationId);

    const userId = headers[HeaderKey.USER_ID];

    this.cls.set(ContextKey.CORRELATION_ID, correlationId);
    if (userId) {
      this.cls.set(ContextKey.USER_ID, userId);
    }
    span?.setAttribute('user.id', userId);

    return next.handle();
  }
}
