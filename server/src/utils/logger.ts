import pino from 'pino'
import pinoHttp from 'pino-http'
import { env } from '../config/env'

export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  ...(env.NODE_ENV !== 'production' && {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true, ignore: 'pid,hostname' },
    },
  }),
})

export const httpLogger = pinoHttp({
  logger,
  customLogLevel: (_req, res) =>
    res.statusCode >= 500 ? 'error'
    : res.statusCode >= 400 ? 'warn'
    : 'info',
  customSuccessMessage: (req, res) =>
    `${req.method} ${req.url} ${res.statusCode}`,
})
