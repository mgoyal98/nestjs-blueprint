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
  aws: {
    // AWS Region to use, defaults to ap-south-1 if not provided
    region: process.env.AWS_REGION || 'ap-south-1',
    // Optional AWS credentials - if not provided, will use IAM role
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    // Default S3 bucket configuration
    s3: {
      defaultBucket: process.env.AWS_S3_BUCKET,
    },
  },
  cache: {
    // Whether cache is enabled
    isEnabled: process.env.CACHE_ENABLED === 'true' || false,
    // Default TTL for cache entries (in seconds)
    defaultTTL: +process.env.CACHE_DEFAULT_TTL || 3600,
    // Default prefix for cache keys
    prefix: process.env.CACHE_PREFIX || 'nestjs:',
    // Redis configuration
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: +process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      db: +process.env.REDIS_DB || 0,
      keyPrefix: process.env.REDIS_KEY_PREFIX || 'nestjs:',
    },
  },
};
