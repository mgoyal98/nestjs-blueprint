import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { IExceptionMap } from './exception-mapper.interface';

export enum EXCEPTION_MESSAGE {
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
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
};
