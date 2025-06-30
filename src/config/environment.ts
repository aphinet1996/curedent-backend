import dotenv from 'dotenv';
import path from 'path';
import type { Secret, SignOptions } from 'jsonwebtoken';

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env' : `.env.${process.env.NODE_ENV || 'development'}`;
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

// Environment variable interface
interface EnvironmentVariables {
  // Server
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  API_PREFIX: string;

  // MongoDB
  MONGODB_URI: string;

  // JWT
  JWT_SECRET: Secret;
  JWT_EXPIRES_IN: SignOptions['expiresIn'];
  JWT_REFRESH_SECRET: Secret;
  JWT_REFRESH_EXPIRES_IN: SignOptions['expiresIn'];

  // CORS
  ALLOWED_ORIGINS: string;

  // Logging
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly';

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX: number;

  // Security
  BCRYPT_SALT_ROUNDS: number;

  // Other configuration
  // [key: string]: string | number | boolean | undefined | Secret;
}

// Validate required environment variables
const requiredEnvVars: (keyof EnvironmentVariables)[] = [
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'JWT_REFRESH_SECRET', // เพิ่มการตรวจสอบ JWT_REFRESH_SECRET
];

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// Create and export config object with defaults
export const config: EnvironmentVariables = {
  // Server
  NODE_ENV: (process.env.NODE_ENV as EnvironmentVariables['NODE_ENV']) || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  API_PREFIX: process.env.API_PREFIX || '/api/v1',

  // MongoDB
  MONGODB_URI: process.env.MONGODB_URI!,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET as Secret,
  JWT_EXPIRES_IN: (process.env.JWT_EXPIRES_IN || '1h') as SignOptions['expiresIn'],
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET as Secret,
  JWT_REFRESH_EXPIRES_IN: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as SignOptions['expiresIn'],

  // CORS
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || 'http://localhost:3000',

  // Logging
  LOG_LEVEL: (process.env.LOG_LEVEL as EnvironmentVariables['LOG_LEVEL']) || 'info',

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // 100 requests per window

  // Security
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
};

// Export individual config properties for destructuring
export const {
  NODE_ENV,
  PORT,
  API_PREFIX,
  MONGODB_URI,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  ALLOWED_ORIGINS,
  LOG_LEVEL,
} = config;

// Helper function to check if environment is production
export const isProduction = NODE_ENV === 'production';
export const isDevelopment = NODE_ENV === 'development';
export const isTest = NODE_ENV === 'test';

export default config;

// import dotenv from 'dotenv';

// // โหลด environment variables จากไฟล์ .env
// dotenv.config();

// export const config = {
//   // Environment
//   NODE_ENV: process.env.NODE_ENV || 'development',
//   PORT: parseInt(process.env.PORT || '3000', 10),

//   // Database
//   MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/stock_management',

//   // JWT
//   JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
//   JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
//   JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key',
//   JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',

//   // Password Hashing
//   BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),

//   // Email Configuration
//   SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
//   SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
//   SMTP_USER: process.env.SMTP_USER || '',
//   SMTP_PASS: process.env.SMTP_PASS || '',

//   // File Upload
//   MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
//   UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads',

//   // Rate Limiting
//   RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
//   RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),

//   // CORS
//   ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],

//   // Logging
//   LOG_LEVEL: process.env.LOG_LEVEL || 'info',
//   LOG_FILE: process.env.LOG_FILE || 'logs/app.log',

//   // Redis (for session storage)
//   REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

//   // Frontend URL
//   FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

//   // API Prefix
//   API_PREFIX: process.env.API_PREFIX || '/api/v1',

//   // Pagination
//   DEFAULT_PAGE_SIZE: parseInt(process.env.DEFAULT_PAGE_SIZE || '20', 10),
//   MAX_PAGE_SIZE: parseInt(process.env.MAX_PAGE_SIZE || '100', 10),

//   // Cache
//   CACHE_TTL: parseInt(process.env.CACHE_TTL || '3600', 10), // 1 hour

//   // Feature Flags
//   ENABLE_EMAIL_VERIFICATION: process.env.ENABLE_EMAIL_VERIFICATION === 'true',
//   ENABLE_TWO_FACTOR: process.env.ENABLE_TWO_FACTOR === 'true',
//   ENABLE_RATE_LIMITING: process.env.ENABLE_RATE_LIMITING !== 'false',

//   // Security
//   SESSION_SECRET: process.env.SESSION_SECRET || 'your-session-secret',
//   ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'your-encryption-key',

//   // Third-party services
//   GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
//   GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
//   FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID || '',
//   FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET || '',

//   // Monitoring
//   SENTRY_DSN: process.env.SENTRY_DSN || '',
  
//   // Development
//   ENABLE_SWAGGER: process.env.ENABLE_SWAGGER !== 'false',
//   ENABLE_SEED_DATA: process.env.ENABLE_SEED_DATA === 'true',
// };

// // Validate required environment variables
// const requiredEnvVars = [
//   'JWT_SECRET',
//   'MONGODB_URI'
// ];

// const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

// if (missingEnvVars.length > 0) {
//   console.error('Missing required environment variables:', missingEnvVars);
//   if (config.NODE_ENV === 'production') {
//     process.exit(1);
//   } else {
//     console.warn('Using default values for missing environment variables in development mode');
//   }
// }

// export default config;