import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { EXCEPTION_MESSAGE } from './exception-mapper.enum';

export type IExceptionMap = {
  [key in EXCEPTION_MESSAGE]: IExceptionObject;
};

export type IExceptionObject = {
  exception:
    | typeof NotFoundException
    | typeof BadRequestException
    | typeof ForbiddenException
    | typeof InternalServerErrorException;
  data: {
    message: string;
    errorCode: EXCEPTION_MESSAGE;
    [key: string]: any;
  };
  xAppException: string;
};
