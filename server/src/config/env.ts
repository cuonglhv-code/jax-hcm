import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optional(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

export const env = {
  NODE_ENV: optional('NODE_ENV', 'development'),
  PORT: Number(optional('PORT', '4000')),
  CLIENT_URL: optional('CLIENT_URL', 'http://localhost:5173'),

  // Database
  DB_HOST: optional('DB_HOST', 'localhost'),
  DB_PORT: Number(optional('DB_PORT', '5432')),
  DB_NAME: optional('DB_NAME', 'hcm_db'),
  DB_USER: optional('DB_USER', 'hcm_user'),
  DB_PASSWORD: optional('DB_PASSWORD', 'secret'),
  DATABASE_URL: process.env.DATABASE_URL,

  // Auth
  JWT_SECRET: optional('JWT_SECRET', 'dev_secret_change_in_production'),
  JWT_EXPIRES_IN: optional('JWT_EXPIRES_IN', '8h'),
  JWT_REFRESH_EXPIRES_IN: optional('JWT_REFRESH_EXPIRES_IN', '7d'),
  BCRYPT_ROUNDS: Number(optional('BCRYPT_ROUNDS', '12')),

  // Storage
  FILE_STORAGE_PATH: optional('FILE_STORAGE_PATH', './uploads'),
  MAX_FILE_SIZE_MB: Number(optional('MAX_FILE_SIZE_MB', '10')),

  // Company
  COMPANY_NAME: optional('COMPANY_NAME', 'Jaxtina Ltd'),
  COMPANY_CURRENCY: optional('COMPANY_CURRENCY', 'GBP'),
  COMPANY_TIMEZONE: optional('COMPANY_TIMEZONE', 'Europe/London'),
} as const;
