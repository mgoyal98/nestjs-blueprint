export interface IStandardResponse {
  status: number;
  state: 'SUCCESS' | 'FAILURE';
  data: any;
  timestamp: number;
  path: string;
}

export interface IStandardResponseSuccess extends IStandardResponse {
  state: 'SUCCESS';
}
