import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000').transform((v) => parseInt(v, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  DATABASE_URL: z.string().optional().default('postgresql://postgres:postgres@localhost:5432/leads_dev'),
  REDIS_URL: z.string().optional().default('redis://localhost:6379'),
  GEMINI_API_KEY: z.string().optional().default(''),
  CLERK_SECRET_KEY: z.string().optional().default(''),
  CLERK_PUBLISHABLE_KEY: z.string().optional().default(''),
  SCRAPER_API_KEY: z.string().optional().default(''),
  NYLAS_API_KEY: z.string().optional().default(''),
  WEBHOOK_SECRET: z.string().optional().default(''),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment variables:', parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
