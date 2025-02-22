import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { configuration } from './config';
import { ClsModule } from 'nestjs-cls';
import { AppLoggerModule } from 'src/common/helpers/logger';
import { HttpConnectorModule } from './common/helpers/http-connector';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
    }),
    AppLoggerModule,
    HttpConnectorModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
