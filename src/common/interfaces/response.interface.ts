export interface IPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface IError {
  code?: string;
  details?: any;
}

export interface IStandardResponse {
  success: boolean;
  status: number;
  message: string;
  data: any;
  pagination?: IPagination | undefined;
  error: IError | null;
  source?: string | undefined;
  timestamp: number;
  path: string;
}
