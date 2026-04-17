import 'dotenv/config'
import express        from 'express'
import helmet         from 'helmet'
import cors           from 'cors'
import cookieParser   from 'cookie-parser'
import morgan         from 'morgan'

import { testDatabaseConnection } from './config/database'
import { errorHandler }           from './middleware/errorHandler'
import authRouter                 from './modules/auth/auth.routes'
import { employeeRouter }         from './modules/employees/employee.routes'
import { payrollRouter }          from './modules/payroll/payroll.routes'
import { recruitmentRouter }      from './modules/recruitment/recruitment.routes'
import { performanceRouter }      from './modules/performance/performance.routes'
import { leaveRouter }            from './modules/leave/leave.routes'
import { learningRouter }         from './modules/learning/learning.routes'

const app  = express()
const PORT = process.env.PORT ?? 4000

// Security & parsing
app.use(helmet())
app.use(cors({
  origin:      process.env.CLIENT_URL ?? 'http://localhost:5173',
  credentials: true,
}))
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

// Health check (unauthenticated)
app.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } })
})

// API routes
app.use('/api/auth', authRouter)

// Core API Routes
app.use('/api/employees',    employeeRouter)
app.use('/api/payroll',      payrollRouter)
app.use('/api/recruitment',  recruitmentRouter)
app.use('/api/performance',  performanceRouter)
app.use('/api/leave',        leaveRouter)
app.use('/api/learning',     learningRouter)

// Additional API Routes
import { searchRouter }       from './modules/search/search.routes'
import { notificationRouter } from './modules/notifications/notification.routes'
import { adminRouter }        from './modules/admin/admin.routes'

app.use('/api/search',        searchRouter)
app.use('/api/notifications', notificationRouter)
app.use('/api/admin',         adminRouter)

// 404
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' })
})

// Centralised error handler (must be last)
app.use(errorHandler)

// Bootstrap
async function bootstrap() {
  await testDatabaseConnection()
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`)
  })
}

bootstrap().catch(err => {
  console.error('Failed to start server:', err)
  process.exit(1)
})

export default app
