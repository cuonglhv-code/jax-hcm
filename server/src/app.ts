import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'node:path'

import { env } from './config/env'
import { db, testDatabaseConnection } from './config/database'
import { httpLogger, logger } from './utils/logger'
import { errorHandler } from './middleware/errorHandler'
import { sendSuccess } from './utils/response'
import pkg from '../../package.json'

import authRouter from './modules/auth/auth.routes'
import { employeeRouter } from './modules/employees/employee.routes'
import { payrollRouter } from './modules/payroll/payroll.routes'
import { recruitmentRouter } from './modules/recruitment/recruitment.routes'
import { performanceRouter } from './modules/performance/performance.routes'
import { leaveRouter } from './modules/leave/leave.routes'
import { learningRouter } from './modules/learning/learning.routes'
import { searchRouter } from './modules/search/search.routes'
import { notificationRouter } from './modules/notifications/notification.routes'
import { adminRouter } from './modules/admin/admin.routes'

const app = express()

// Trust proxy (for rate limiting behind nginx/load balancer)
app.set('trust proxy', 1)

// HTTP logging
app.use(httpLogger)

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
)

// CORS
app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = [env.CLIENT_URL]
      if (!origin || allowed.includes(origin)) {
        callback(null, true)
      } else if (env.NODE_ENV === 'development') {
        callback(null, true)
      } else {
        callback(null, false)
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)

// Parsing
app.use(cookieParser())
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

// Health check (unauthenticated)
app.get('/health', async (_req, res) => {
  try {
    await db.raw('SELECT 1')
    sendSuccess(res, {
      status: 'ok',
      environment: env.NODE_ENV,
      version: pkg.version,
      dbStatus: 'connected',
      storageProvider: env.FILE_STORAGE_PROVIDER,
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    res.status(503).json({
      success: false,
      error: 'Database unavailable',
      data: {
        status: 'down',
        timestamp: new Date().toISOString(),
      },
    })
  }
})

// Routes
app.use('/api/auth', authRouter)
app.use('/api/employees', employeeRouter)
app.use('/api/payroll', payrollRouter)
app.use('/api/recruitment', recruitmentRouter)
app.use('/api/performance', performanceRouter)
app.use('/api/leave', leaveRouter)
app.use('/api/learning', learningRouter)
app.use('/api/search', searchRouter)
app.use('/api/notifications', notificationRouter)
app.use('/api/admin', adminRouter)

// Static files (production only)
if (env.NODE_ENV === 'production') {
  const clientPath = path.join(__dirname, '../../client/dist')
  app.use(express.static(clientPath))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'))
  })
}

// 404
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' })
})

// Centralised error handler (must be last)
app.use(errorHandler)

// Bootstrap
async function bootstrap() {
  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 Server running on http://localhost:${env.PORT}`)
  })

  // Verify DB
  try {
    await testDatabaseConnection()
  } catch (err) {
    logger.error({ err }, 'Database connection failed during bootstrap')
  }

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received. Shutting down gracefully...`)
    server.close(async () => {
      await db.destroy()
      logger.info('✅ Database connections closed.')
      process.exit(0)
    })
    // Force exit after 10s
    setTimeout(() => {
      logger.error('❌ Force shutdown after timeout.')
      process.exit(1)
    }, 10_000)
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

if (env.NODE_ENV !== 'test') {
  bootstrap().catch(err => {
    logger.error({ err }, 'Failed to start server')
    process.exit(1)
  })
}

process.on('uncaughtException', err => {
  logger.error({ err }, '[uncaughtException]')
  process.exit(1)
})
process.on('unhandledRejection', err => {
  logger.error({ err }, '[unhandledRejection]')
})

export default app
