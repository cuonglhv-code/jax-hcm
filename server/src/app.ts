import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { authRouter } from './modules/auth/auth.routes';
import { employeeRouter } from './modules/employees/employee.routes';
import { payrollRouter } from './modules/payroll/payroll.routes';
import { recruitmentRouter } from './modules/recruitment/recruitment.routes';
import { performanceRouter } from './modules/performance/performance.routes';
import { leaveRouter } from './modules/leave/leave.routes';
import { learningRouter } from './modules/learning/learning.routes';
import { logger } from './config/logger';
import { env } from './config/env';

const app = express();

// ─── Security & Parsing ───────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// ─── Static uploads ───────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
const API = '/api';
app.use(`${API}/auth`, authRouter);
app.use(`${API}/employees`, employeeRouter);
app.use(`${API}/payroll`, payrollRouter);
app.use(`${API}/recruitment`, recruitmentRouter);
app.use(`${API}/performance`, performanceRouter);
app.use(`${API}/leave`, leaveRouter);
app.use(`${API}/learning`, learningRouter);

// ─── Error Handlers ───────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
if (require.main === module) {
  const port = env.PORT;
  app.listen(port, () => {
    logger.info(`🚀 HCM Server running on http://localhost:${port}`);
    logger.info(`📋 Environment: ${env.NODE_ENV}`);
  });
}

export default app;
