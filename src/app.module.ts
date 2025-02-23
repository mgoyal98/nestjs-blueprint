import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { configuration } from './config';
import { ClsModule } from 'nestjs-cls';
import { AppLoggerModule } from 'src/common/helpers/logger';
import { HttpConnectorModule } from './common/helpers/http-connector';
import { DatabaseModule } from './common/database';
import { ExampleModule } from './modules/example/example.module';
import { UserModule } from './modules/user/user.module';

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
    DatabaseModule,
    ExampleModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
