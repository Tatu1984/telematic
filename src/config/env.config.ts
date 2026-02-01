// Environment configuration - centralized environment variable access

export const ENV = {
  // App
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',

  // API
  API_URL: process.env.NEXT_PUBLIC_API_URL || '',
  WS_URL: process.env.NEXT_PUBLIC_WS_URL || '',
  USE_REAL_BACKEND: process.env.NEXT_PUBLIC_USE_REAL_BACKEND === 'true',

  // Auth
  AUTH_SECRET: process.env.AUTH_SECRET || '',
  AUTH_URL: process.env.AUTH_URL || process.env.NEXTAUTH_URL || '',

  // Microsoft Entra ID
  MICROSOFT_ENTRA_ID: {
    CLIENT_ID: process.env.AUTH_MICROSOFT_ENTRA_ID_ID || '',
    CLIENT_SECRET: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET || '',
    TENANT_ID: process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID || '',
  },

  // Database
  DATABASE_URL: process.env.DATABASE_URL || '',

  // Redis
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL || '',
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN || '',

  // Rate Limiting
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),

  // Sentry
  SENTRY_DSN: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || '',
  SENTRY_ORG: process.env.SENTRY_ORG || '',
  SENTRY_PROJECT: process.env.SENTRY_PROJECT || '',

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  // Demo/Seed
  SEED_SECRET: process.env.SEED_SECRET || '',
  DEMO_PASSWORD: process.env.DEMO_PASSWORD || 'FleetTrack2024!',
} as const;

// Validate required environment variables for production
export function validateEnv(): void {
  if (!ENV.IS_PRODUCTION) return;

  const required = [
    'DATABASE_URL',
    'AUTH_SECRET',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
