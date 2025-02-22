import * as lodash from 'lodash';
import { EXCEPTION_MAP, EXCEPTION_MESSAGE } from './exception-mapper.enum';
import { HttpException } from '@nestjs/common';

lodash.templateSettings.interpolate = /\{\{(.+?)\}\}/g;

export function exceptionMapper(
  errorEnum: EXCEPTION_MESSAGE,
  additional?: Record<string, any>,
): HttpException {
  const exceptionObject = { ...EXCEPTION_MAP[errorEnum] };
  const exceptionClass = exceptionObject.exception;
  delete exceptionObject.exception;
  if (lodash.isPlainObject(additional)) {
    exceptionObject.data = {
      ...exceptionObject.data,
      ...additional,
    };
    exceptionObject.data.message = lodash.template(
      exceptionObject.data.message,
    )(additional);
    exceptionObject.xAppException = lodash.template(
      exceptionObject.xAppException,
    )(additional);
  }
  return new exceptionClass(exceptionObject);
}
