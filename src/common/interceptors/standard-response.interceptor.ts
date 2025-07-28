import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IStandardResponse } from 'src/common/interfaces';
import { Request, Response } from 'express';
import { AppLoggerService } from 'src/common/helpers/logger';

@Injectable()
export class StandardResponseInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next
      .handle()
      .pipe(map((data) => this.mapStandardResponse(data, context)));
  }

  private mapStandardResponse(
    data: any,
    context: ExecutionContext,
  ): IStandardResponse {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const statusCode = response.statusCode;

    const setHeaders = data?.headers ?? {};
    const responseData = data?.data ?? data;
    const pagination = data?.pagination ?? undefined;
    const message = data?.message ?? 'Success';

    for (const key in setHeaders) {
      response.setHeader(key, setHeaders[key]);
    }

    const resp = {
      success: true,
      status: statusCode,
      message: message,
      data: responseData,
      pagination: pagination,
      error: null,
      timestamp: Date.now(),
      path: request.path,
    };

    this.logger.info('[Response Interceptor] Response', { response: resp });

    return resp;
  }
}
