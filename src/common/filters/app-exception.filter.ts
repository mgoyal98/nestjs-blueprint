import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppLoggerService } from '../helpers/logger';
import { isArray, isEmpty } from 'lodash';
import { IStandardResponseFailure } from '../interfaces';
import { ConfigService } from '@nestjs/config';
import { HeaderKey } from '../enums';
@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  constructor(
    private config: ConfigService,
    private logger: AppLoggerService,
  ) {}

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    this.logger.error(
      `[${this.config.get('app.name')}] [Exception Filter] Caught Exception`,
      { exception },
      exception,
    );

    const errorResponse: IStandardResponseFailure = {
      state: 'FAILURE',
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp: Date.now(),
      path: request.route.path,
      statusText:
        'Something went wrong! Please wait while we get this checked.',
      source: this.config.get('app.name'),
      data: { message: 'Looks like an unhandled error.' },
    };

    if (exception.response) {
      errorResponse.status = this.getStatus(
        exception.response,
        exception?.status,
      );
      errorResponse.source = this.getSource(
        exception.response,
        errorResponse.source,
      );
      errorResponse.path = this.getPath(exception.response, errorResponse.path);
      errorResponse.data = this.getData(exception.response, errorResponse.data);
      errorResponse.statusText = this.getStatusText(
        exception.response,
        exception.response?.message,
        errorResponse.statusText,
        errorResponse.data,
      );
    }

    if (exception?.response?.xAppException) {
      // known exceptions thrown by app service
      response.setHeader(
        HeaderKey.APP_EXCEPTION,
        exception?.response?.xAppException,
      );
    }

    this.logger.error(
      `[${this.config.get('app.name')}] [Exception Filter] Error Response`,
      { errorResponse },
    );

    response.status(errorResponse.status).json(errorResponse);
  }

  private getStatus(response: any, originalStatus: any) {
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    if (response?.statusCode) {
      status = response?.statusCode;
    } else if (response?.data?.statusCode || response?.data?.status) {
      status = response?.data?.statusCode || response?.data?.status;
    } else if (originalStatus) {
      status = originalStatus;
    }
    return status;
  }

  private getStatusText(
    response: any,
    responseData: any,
    statusText: string,
    data: any,
  ) {
    if (response?.data?.statusText) {
      statusText = response?.data?.statusText;
    } else if (isArray(responseData) && !isEmpty(responseData)) {
      // class-validator errors
      statusText = responseData[0];
    } else if (data?.message) {
      // else fallback to the message
      statusText = data.message;
    } else if (response?.statusText) {
      statusText = response?.statusText;
    }
    return statusText;
  }

  private getSource(response: any, source: string) {
    if (response?.source) {
      source = response?.source;
    } else if (response?.data?.source) {
      source = response?.data?.source;
    }
    return source;
  }

  private getPath(response: any, path: any) {
    if (response?.path) {
      path = response?.path;
    } else if (response?.data?.path) {
      path = response?.data?.path;
    }
    return path;
  }

  private getData(response: any, data: any) {
    if (response.data?.data) {
      data = response.data?.data;
    } else if (response?.data) {
      data =
        typeof response.data === 'string'
          ? {
              message: response.data,
            }
          : response.data;
    } else if (response?.message) {
      data = {
        message: response?.message,
      };
    }
    return data;
  }
}
