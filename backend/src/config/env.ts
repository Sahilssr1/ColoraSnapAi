import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PREFIX: z.string().default('/api/v1'),
  CORS_ORIGIN: z.string().default('*'),

  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/calora_db?schema=public'),
  DIRECT_URL: z.string().optional(),

  REDIS_URL: z.string().default('redis://localhost:6379'),
  REDIS_TTL_SECONDS: z.string().default('3600').transform((val) => parseInt(val, 10)),

  JWT_ACCESS_SECRET: z.string().default('calora_jwt_access_secret_super_secure_key_2026'),
  JWT_REFRESH_SECRET: z.string().default('calora_jwt_refresh_secret_super_secure_key_2026'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  // Groq Cloud (gsk_...)
  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().default('openai/gpt-oss-120b'),

  // xAI Grok Vision (xai-...)
  GROK_API_KEY: z.string().optional(),
  XAI_API_KEY: z.string().optional(),
  GROK_MODEL: z.string().default('grok-2-vision-1212'),

  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
  OPENAI_API_KEY: z.string().optional(),

  // Web OAuth client ID (type WEB) from Google Cloud Console. The backend
  // checks every Google ID token against this value; without it /auth/google
  // cannot verify a sign-in and will return a clear configuration error.
  GOOGLE_WEB_CLIENT_ID: z.string().optional(),

  USDA_API_KEY: z.string().default('DEMO_KEY'),
  OPENFOODFACTS_BASE_URL: z.string().default('https://world.openfoodfacts.org/api/v2'),

  UPLOAD_MAX_FILE_SIZE_MB: z.string().default('10').transform((val) => parseInt(val, 10)),
  UPLOAD_DIR: z.string().default('./uploads'),

  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform((val) => parseInt(val, 10)),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('200').transform((val) => parseInt(val, 10)),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment configuration:', parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
