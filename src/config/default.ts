import { Env } from 'src/common/enums';

export const config = {
  app: {
    name: process.env.APP_NAME || 'dev-nestjs-blueprint',
    port: +process.env.APP_PORT || 3000,
    env: (process.env.NODE_ENV || 'development') as Env,
    prefix: process.env.APP_PREFIX || 'api',
  },
  logger: {
    delimitter: false,
    colorify: false,
  },
  database: {
    mongoDbUrl:
      process.env.MONGO_DB_URL || 'mongodb://localhost:27017/nestjs_blueprint',
  },
};
