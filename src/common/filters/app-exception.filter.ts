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
import { trace, SpanStatusCode } from '@opentelemetry/api';

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

    const span = trace.getActiveSpan();
    if (span) {
      span.recordException(exception);
    }

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
      errorResponse.error.code = this.getErrorCode(
        exception.response,
        errorResponse.status,
      );
      delete exception.response.data?.errorCode;
    }

    if (exception?.response?.xAppException) {
      // known exceptions thrown by app service
      response.setHeader(
        HeaderKey.APP_EXCEPTION,
        exception?.response?.xAppException,
      );
    }

    span
      ?.setStatus({
        code: SpanStatusCode.ERROR,
        message: errorResponse?.message,
      })
      ?.setAttribute('appException', errorResponse?.message)
      ?.recordException(
        errorResponse?.data?.errorCode || errorResponse?.message,
      );

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

  private getErrorCode(response: any, statusCode: number) {
    if (response?.data?.errorCode) {
      return response?.data?.errorCode;
    }

    // Map HTTP status codes to error codes
    const statusCodeToErrorCode: { [key: number]: string } = {
      400: 'BAD_REQUEST_EXCEPTION',
      401: 'UNAUTHORIZED_EXCEPTION',
      403: 'FORBIDDEN_EXCEPTION',
      404: 'NOT_FOUND_EXCEPTION',
      405: 'METHOD_NOT_ALLOWED_EXCEPTION',
      406: 'NOT_ACCEPTABLE_EXCEPTION',
      409: 'CONFLICT_EXCEPTION',
      410: 'GONE_EXCEPTION',
      411: 'LENGTH_REQUIRED_EXCEPTION',
      412: 'PRECONDITION_FAILED_EXCEPTION',
      413: 'PAYLOAD_TOO_LARGE_EXCEPTION',
      414: 'URI_TOO_LONG_EXCEPTION',
      415: 'UNSUPPORTED_MEDIA_TYPE_EXCEPTION',
      416: 'RANGE_NOT_SATISFIABLE_EXCEPTION',
      417: 'EXPECTATION_FAILED_EXCEPTION',
      418: 'I_AM_A_TEAPOT_EXCEPTION',
      421: 'MISDIRECTED_EXCEPTION',
      422: 'UNPROCESSABLE_ENTITY_EXCEPTION',
      423: 'LOCKED_EXCEPTION',
      424: 'FAILED_DEPENDENCY_EXCEPTION',
      425: 'TOO_EARLY_EXCEPTION',
      426: 'UPGRADE_REQUIRED_EXCEPTION',
      428: 'PRECONDITION_REQUIRED_EXCEPTION',
      429: 'TOO_MANY_REQUESTS_EXCEPTION',
      431: 'REQUEST_HEADER_FIELDS_TOO_LARGE_EXCEPTION',
      451: 'UNAVAILABLE_FOR_LEGAL_REASONS_EXCEPTION',
      500: 'INTERNAL_SERVER_EXCEPTION',
      501: 'NOT_IMPLEMENTED_EXCEPTION',
      502: 'BAD_GATEWAY_EXCEPTION',
      503: 'SERVICE_UNAVAILABLE_EXCEPTION',
      504: 'GATEWAY_TIMEOUT_EXCEPTION',
      505: 'HTTP_VERSION_NOT_SUPPORTED_EXCEPTION',
      506: 'VARIANT_ALSO_NEGOTIATES_EXCEPTION',
      507: 'INSUFFICIENT_STORAGE_EXCEPTION',
      508: 'LOOP_DETECTED_EXCEPTION',
      510: 'NOT_EXTENDED_EXCEPTION',
      511: 'NETWORK_AUTHENTICATION_REQUIRED_EXCEPTION',
    };

    return statusCodeToErrorCode[statusCode] || 'INTERNAL_SERVER_EXCEPTION';
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
