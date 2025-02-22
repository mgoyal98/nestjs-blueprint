import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppLoggerService } from '../helpers/logger';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: async (
        configService: ConfigService,
        logger: AppLoggerService,
      ) => {
        return {
          uri: configService.get('database.mongoDbUrl'),
          autoCreate: true,
          autoIndex: true,
          appName: configService.get('app.name'),
          onConnectionCreate: (connection) => {
            if (connection.readyState === 2) {
              logger.debug('Connecting to MongoDB');
            }
            connection.on('connected', () => {
              logger.debug('Connected to MongoDB successfully');
            });
            connection.on('disconnected', () => {
              logger.debug('Disconnected from MongoDB');
            });
            connection.on('error', (error) => {
              logger.error('Failed to connect to MongoDB', error);
            });
            connection.on('reconnectFailed', (error) => {
              logger.error('Failed to reconnect to MongoDB', error);
            });
          },
        };
      },
      inject: [ConfigService, AppLoggerService],
    }),
  ],
})
export class DatabaseModule {}
