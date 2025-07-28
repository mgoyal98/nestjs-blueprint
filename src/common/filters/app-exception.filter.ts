import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppLoggerService } from 'src/common/helpers/logger';
import { isArray, isEmpty } from 'lodash';
import { IStandardResponse } from 'src/common/interfaces';
import { ConfigService } from '@nestjs/config';
import { HeaderKey } from 'src/common/enums';
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
      `[Exception Filter] Caught Exception`,
      { exception },
      exception,
    );

    const errorResponse: IStandardResponse = {
      success: false,
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Something went wrong! Please wait while we get this checked.',
      error: {
        code: 'INTERNAL_SERVER_EXCEPTION',
        details: { message: 'Looks like an unhandled error.' },
      },
      data: null,
      source: this.config.get('app.name'),
      timestamp: Date.now(),
      path: request?.route?.path || request?.path,
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
      errorResponse.error.details = this.getData(
        exception.response,
        errorResponse.data,
      );
      errorResponse.message = this.getMessage(
        exception.response,
        exception.response?.message,
        errorResponse.message,
        errorResponse.error.details,
      );
      errorResponse.error.code = this.getErrorCode(exception.response);
      delete exception.response.data?.errorCode;
    }

    if (exception?.response?.xAppException) {
      // known exceptions thrown by app service
      response.setHeader(
        HeaderKey.APP_EXCEPTION,
        exception?.response?.xAppException,
      );
    }

    this.logger.error(`[Exception Filter] Error Response`, { errorResponse });

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

  private getErrorCode(response: any) {
    if (response?.data?.errorCode) {
      return response?.data?.errorCode;
    }
    return 'INTERNAL_SERVER_EXCEPTION';
  }

  private getMessage(
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
