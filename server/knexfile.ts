import type { Knex } from 'knex'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env') })

const base: Knex.Config = {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    database: process.env.DB_NAME ?? 'hcm_db',
    user: process.env.DB_USER ?? 'hcm_user',
    password: process.env.DB_PASSWORD ?? 'secret',
  },
  migrations: {
    directory: path.resolve(__dirname, 'src/db/migrations'),
    extension: 'ts',
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: path.resolve(__dirname, 'src/db/seeds'),
    extension: 'ts',
  },
  pool: { min: 2, max: 10 },
}

const config: { [env: string]: Knex.Config } = {
  development: { ...base, debug: false },
  production: {
    ...base,
    debug: false,
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    },
  },
  test: {
    ...base,
    connection: process.env.DATABASE_URL || {
      ...(base.connection as object),
      database: process.env.DB_NAME_TEST ?? 'jax_hcm_test',
    },
  },
}

export default config
module.exports = config
