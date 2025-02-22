import {
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { IExceptionMap } from './exception-mapper.interface';

export enum EXCEPTION_MESSAGE {
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  API_KEY_REQUIRED = 'API_KEY_REQUIRED',
  INVALID_API_KEY = 'INVALID_API_KEY',
}

export const EXCEPTION_MAP: IExceptionMap = {
  [EXCEPTION_MESSAGE.USER_NOT_FOUND]: {
    exception: NotFoundException,
    data: {
      message:
        'User with {{id}} Not Found. Please check your details and try again.',
      errorCode: EXCEPTION_MESSAGE.USER_NOT_FOUND,
    },
    xAppException:
      'User with {{id}} Not Found. Please check your details and try again.',
  },
  [EXCEPTION_MESSAGE.INTERNAL_SERVER_ERROR]: {
    exception: InternalServerErrorException,
    data: {
      message: 'Oops! Something went wrong on our end. Please try again later.',
      errorCode: EXCEPTION_MESSAGE.INTERNAL_SERVER_ERROR,
    },
    xAppException:
      'Oops! Something went wrong on our end. Please try again later.',
  },
  [EXCEPTION_MESSAGE.API_KEY_REQUIRED]: {
    exception: UnauthorizedException,
    data: {
      message: 'API key is required',
      errorCode: EXCEPTION_MESSAGE.API_KEY_REQUIRED,
    },
    xAppException: 'API key is required',
  },
  [EXCEPTION_MESSAGE.INVALID_API_KEY]: {
    exception: UnauthorizedException,
    data: {
      message: 'Invalid API key',
      errorCode: EXCEPTION_MESSAGE.INVALID_API_KEY,
    },
    xAppException: 'Invalid API key',
  },
};
