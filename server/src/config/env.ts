import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  FRONTEND_URL: z.string().url().default('http://localhost:5000'),
  CORS_ORIGIN: z.string().default('http://localhost:5173,http://localhost:5000,http://127.0.0.1:5173'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters long').default(
    process.env.NODE_ENV === 'production'
      ? (() => {
          throw new Error('FATAL: JWT_SECRET environment variable is required in production!');
        })()
      : 'pausepulse_dev_insecure_jwt_secret_change_in_production_2026'
  ),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_ID_MONTHLY: z.string().optional(),
  STRIPE_PRICE_ID_YEARLY: z.string().optional(),
  STRIPE_PRICE_ID_TEAM: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  DATABASE_URL: z.string().default('file:./dev.db'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.format());
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

export const env = parsedEnv.success ? parsedEnv.data : envSchema.parse({});
