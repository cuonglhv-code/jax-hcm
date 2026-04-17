import type { Knex } from 'knex'
import { env } from './src/config/env'
import path from 'path'

const base: Knex.Config = {
  client: 'pg',
  connection: env.DATABASE_URL,
  migrations: {
    directory: path.resolve(__dirname, 'src/db/migrations'),
    extension: 'ts',
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: path.resolve(__dirname, 'src/db/seeds'),
    extension: 'ts',
  },
  pool: { 
    min: env.DATABASE_POOL_MIN, 
    max: env.DATABASE_POOL_MAX 
  },
}

const config: { [key: string]: Knex.Config } = {
  development: { ...base, debug: false },
  production: {
    ...base,
    debug: false,
    connection: {
      connectionString: env.DATABASE_URL,
      ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    },
  },
  test: {
    ...base,
    connection: env.DATABASE_URL,
  },
}

export default config
module.exports = config
