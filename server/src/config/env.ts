import { z } from 'zod'
import dotenv from 'dotenv'

dotenv.config()

const envSchema = z.object({
  DATABASE_URL:               z.string().min(1),
  DATABASE_POOL_MIN:          z.coerce.number().default(2),
  DATABASE_POOL_MAX:          z.coerce.number().default(10),
  PORT:                       z.coerce.number().default(4000),
  NODE_ENV:                   z.enum(['development', 'test', 'production'])
                              .default('development'),
  JWT_SECRET:                 z.string().min(32,
                              'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN:             z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_DAYS: z.coerce.number().default(7),
  BCRYPT_ROUNDS:              z.coerce.number().default(12),
  CLIENT_URL:                 z.string().url().default('http://localhost:5173'),
  FILE_STORAGE_PROVIDER:      z.enum(['local', 's3']).default('local'),
  FILE_STORAGE_PATH:          z.string().default('./uploads'),
  COMPANY_NAME:               z.string().default('Jaxtina HCM'),
  COMPANY_JURISDICTION:       z.string().default('GB'),
})

export type Env = z.infer<typeof envSchema>

const _env = envSchema.safeParse(process.env)
if (!_env.success) {
  console.error('❌ Invalid environment variables:')
  console.error(_env.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = _env.data
