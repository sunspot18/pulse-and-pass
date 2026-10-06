import { config } from 'dotenv';
import { z } from 'zod';

// Load .env file
config();

const envSchema = z.object({
  PORT: z
    .string()
    .default('4000')
    .transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().url().default('http://localhost:3000'),
  DATABASE_URL: z
    .string()
    .default('postgresql://postgres:postgrespassword@localhost:5432/pulse_and_pass'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters long'),
  HMAC_SECRET: z.string().min(16, 'HMAC_SECRET must be at least 16 characters long'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables configuration:', parsedEnv.error.format());
  process.exit(1);
}

export const ENV = parsedEnv.data;
