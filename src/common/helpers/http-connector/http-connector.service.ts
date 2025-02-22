import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { RequestOptions } from './http-connector.interface';
import { AxiosRequestConfig } from 'axios';
import { firstValueFrom } from 'rxjs';
import { AppLoggerService } from '../logger';
import { HttpRequestType } from './http-connector.enum';

@Injectable()
export class HttpConnectorService {
  constructor(
    private httpService: HttpService,
    private logger: AppLoggerService,
  ) {}

  private logPrefix(funcName: string) {
    return `[${this.constructor.name}.${funcName}]`;
  }

  private getHeaders(requestType?: HttpRequestType) {
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    switch (requestType) {
      case HttpRequestType.Internal:
        headers = {
          ...headers,
          'x-internal-source': 'true',
        };
        break;
    }
    return headers;
  }

  async request<T>(opts: RequestOptions, requestType?: HttpRequestType) {
    const logPrefix = this.logPrefix(this.request.name);
    try {
      this.logger.debug(`${logPrefix} Remote API Request`, {
        requestOptions: opts,
      });
      const requestOpts: AxiosRequestConfig = {
        method: opts.method,
        url: opts.url,
        data: opts.data,
        headers: { ...this.getHeaders(requestType), ...opts.headers },
        params: opts.params,
      };
      const resp = await firstValueFrom(
        this.httpService.request<T>(requestOpts),
      );
      this.logger.debug(`${logPrefix} Remote API Response`, {
        requestOptions: opts,
        response: resp.data,
        responseStatus: resp.status,
      });
      return resp.data;
    } catch (remoteApiFailure) {
      this.logger.error(
        `${logPrefix} Remote API Failure`,
        { opts, data: remoteApiFailure.response?.data },
        remoteApiFailure,
      );
      throw remoteApiFailure;
    }
  }
}
