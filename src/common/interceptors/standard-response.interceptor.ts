import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IStandardResponseSuccess } from '../interfaces';
import { Request, Response } from 'express';

@Injectable()
export class StandardResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next
      .handle()
      .pipe(map((data) => mapStandardResponse(data, context)));
  }
}

function mapStandardResponse(
  data: any,
  context: ExecutionContext,
): IStandardResponseSuccess {
  const request = context.switchToHttp().getRequest<Request>();
  const response = context.switchToHttp().getResponse<Response>();

  let setHeaders: Record<string, string | number | readonly string[]> = {};

  const responseData = data?.setHeaders ? data?.data : data;

  if (data?.setHeaders) {
    setHeaders = data.setHeaders;
    delete data.setHeaders;
  }

  for (const key in setHeaders) {
    response.setHeader(key, setHeaders[key]);
  }

  return {
    state: 'SUCCESS',
    status: 200,
    data: responseData,
    timestamp: Date.now(),
    path: request.path,
  };
}
