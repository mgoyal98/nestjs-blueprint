import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { configuration } from './config';
import { ClsModule } from 'nestjs-cls';
import { AppLoggerModule } from 'src/common/helpers/logger';
import { HttpConnectorModule } from './common/helpers/http-connector';
import { DatabaseModule } from './common/database';
import { ExampleModule } from './modules/example/example.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtModule } from '@nestjs/jwt';

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
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('auth.jwt.accessTokenSecret'),
        signOptions: {
          expiresIn: configService.get('auth.jwt.accessTokenExpiry'),
        },
      }),
      inject: [ConfigService],
      global: true,
    }),
    AppLoggerModule,
    HttpConnectorModule,
    DatabaseModule,
    ExampleModule,
    UserModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
