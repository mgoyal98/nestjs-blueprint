import { Global, Module } from '@nestjs/common';
import { HttpConnectorService } from './http-connector.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    HttpModule.registerAsync({
      useFactory: async (configService: ConfigService) => ({
        timeout: configService.get('http.timeout') || 30000,
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [HttpConnectorService],
  exports: [HttpConnectorService],
})
export class HttpConnectorModule {}
