import * as tracer from './tracer'; // Import OpenTelemetry tracer
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import {
  RequestInterceptor,
  SetContextInterceptor,
  StandardResponseInterceptor,
} from 'src/common/interceptors';
import { ClsService } from 'nestjs-cls';
import { AppLoggerService } from 'src/common/helpers/logger';
import { formatErrorText } from 'src/common/utils';
import helmet from 'helmet';
import { AppExceptionFilter } from 'src/common/filters';
import { ValidationPipe } from '@nestjs/common';
import mongoose from 'mongoose';
import { generateMultipleKeyPairs } from 'e2ee-adapter';
import * as bodyParser from 'body-parser';
import { E2EEInterceptor } from 'e2ee-adapter';

async function bootstrap() {
  tracer.start();

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.use(helmet());
  app.enableCors({});

  const config = app.get(ConfigService);
  const appPort = config.get<number>('app.port');
  const appName = config.get<string>('app.name');
  const appPrefix = config.get<string>('app.prefix');

  const logger = app.get(AppLoggerService);
  app.useLogger(logger);

  app.setGlobalPrefix(appPrefix);

  if (config.get<boolean>('e2ee.enabled')) {
    app.use(bodyParser.text({ type: 'text/plain' }));
    const serverKeys = await generateMultipleKeyPairs(
      config.get<string[]>('e2ee.domains'),
      2048,
    );
    config.set('e2ee.keys', serverKeys);
    app.useGlobalInterceptors(
      new E2EEInterceptor({
        config: {
          keys: serverKeys,
          enableRequestDecryption: true,
          enableResponseEncryption: true,
          excludePaths: ['/api/health', '/api/keys'],
          excludeMethods: ['HEAD', 'OPTIONS'],
          allowEmptyRequestBody: true,
          enforced: config.get<boolean>('e2ee.enforced'),
        },
      }),
    );
  }

  app.useGlobalInterceptors(
    new SetContextInterceptor(app.get(ClsService), config),
    new RequestInterceptor(logger),
    new StandardResponseInterceptor(logger),
  );
  app.useGlobalFilters(new AppExceptionFilter(config, logger));

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  process.on('unhandledRejection', (err: any) => {
    const errorText: string = formatErrorText(appName, err);
    logger.error(errorText, err);
  });
  process.on('uncaughtException', (err: any) => {
    const errorText: string = formatErrorText(appName, err);
    logger.error(errorText, err);
  });

  mongoose.set('debug', function (collection, method, query, doc, options) {
    logger.debug(`[MongoDB] ${collection}.${method}`, {
      query,
      doc,
      options,
    });
  });

  await app.listen(appPort);

  logger.info(`${appName} is running on port ${appPort}`, {
    appPrefix,
  });
}
bootstrap();
