import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import {
  SetContextInterceptor,
  StandardResponseInterceptor,
} from 'src/common/interceptors';
import { ClsService } from 'nestjs-cls';
import { AppLoggerService } from 'src/common/helpers/logger';
import { formatErrorText } from 'src/common/utils';
import helmet from 'helmet';

async function bootstrap() {
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
  app.useGlobalInterceptors(
    new SetContextInterceptor(app.get(ClsService), config),
    new StandardResponseInterceptor(),
  );

  process.on('unhandledRejection', (err: any) => {
    const errorText: string = formatErrorText(appName, err);
    logger.error(errorText, err);
  });
  process.on('uncaughtException', (err: any) => {
    const errorText: string = formatErrorText(appName, err);
    logger.error(errorText, err);
  });

  await app.listen(appPort);

  logger.info(`${appName} is running on port ${appPort}`, {
    appPrefix,
  });
}
bootstrap();
