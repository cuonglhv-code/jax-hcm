import knex from 'knex'
import { env } from './env'
import { logger } from '../utils/logger'
import knexConfig from '../../knexfile'

const environment = env.NODE_ENV
export const db = knex(knexConfig[environment])

export async function testDatabaseConnection(): Promise<void> {
  await db.raw('SELECT 1')
  logger.info('✅ Database connected')
}

export default db
