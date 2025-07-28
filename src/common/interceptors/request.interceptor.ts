import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { AppLoggerService } from 'src/common/helpers/logger';

@Injectable()
export class RequestInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    this.logger.info('[Request Interceptor] Request', {
      request: {
        headers: request.headers,
        body: request.body,
        params: request.params,
        path: request.path,
        method: request.method,
        url: request.url,
        query: request.query,
        user: request.user,
        ip: request.ip,
      },
    });

    return next.handle();
  }
}
