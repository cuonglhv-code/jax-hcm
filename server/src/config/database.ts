import knex from 'knex'
import { env } from './env'
import { logger } from './logger'
import knexConfig from '../../knexfile'

const environment = env.NODE_ENV === 'test' ? 'test' : 'development'
export const db = knex(knexConfig[environment])

export async function testDatabaseConnection(): Promise<void> {
  await db.raw('SELECT 1')
  logger.info('✅ Database connected')
}

export default db
