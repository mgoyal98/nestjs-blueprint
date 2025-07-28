import { Env } from 'src/common/enums';

export const config = {
  app: {
    name: process.env.APP_NAME || 'dev-nestjs-blueprint',
    port: +process.env.APP_PORT || 3000,
    env: (process.env.NODE_ENV || 'development') as Env,
    prefix: process.env.APP_PREFIX || 'api',
  },
  http: {
    timeout: +process.env.HTTP_TIMEOUT || 30000,
  },
  logger: {
    delimitter: false,
    colorify: false,
    debug: false,
    pii: {
      enabled: true,
      // List of keys that should be redacted from logs
      keys: process.env.PII_KEYS
        ? process.env.PII_KEYS.split(',')
        : [
            'password',
            'token',
            'secret',
            'authorization',
            'email',
            'phone',
            'address',
          ],
      // The text to replace PII values with
      mask: '***REDACTED***',
    },
  },
  database: {
    mongoDbUrl:
      process.env.MONGO_DB_URL || 'mongodb://localhost:27017/nestjs_blueprint',
  },
  auth: {
    // NOTE: This is a comma-separated list of API keys.
    // This is for demo purposes. In a real-world scenario,
    // you would store these in a more secure location such as
    // an AWS Secrets Manager or a DB.
    apiKeys: process.env.API_KEYS
      ? process.env.API_KEYS.split(',')
      : ['1234567890'],
    jwt: {
      // This is for demo purposes. In a real-world scenario,
      // you would store these in a more secure location such as
      // an AWS Secrets Manager or a DB.
      accessTokenSecret: process.env.JWT_SECRET || 'access_token_secret',
      accessTokenExpiry: process.env.JWT_EXPIRES_IN || '1h',
      refreshTokenSecret:
        process.env.JWT_REFRESH_SECRET || 'refresh_token_secret',
      refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },
  },
};
