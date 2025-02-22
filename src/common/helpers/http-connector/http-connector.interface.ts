// import { OutgoingHttpHeader } from 'http';
import { HttpMethod } from './http-connector.enum';
import { AxiosHeaders } from 'axios';

export interface RequestOptions {
  method: HttpMethod;
  url: string;
  data?: any;
  headers?: AxiosHeaders;
  params?: Record<string, any>;
}
