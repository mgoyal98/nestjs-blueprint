import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);
  const appPort = config.get<number>('app.port');
  const appName = config.get<string>('app.name');

  app.setGlobalPrefix(config.get<string>('app.prefix'));

  await app.listen(appPort);

  console.log(`${appName} is running on port ${appPort}`);
}
bootstrap();
