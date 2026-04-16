# Jaxtina HCM

A production-ready **Human Capital Management** system for mid-size companies (~2,000 employees), built on a TypeScript monorepo.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS v3, TanStack Query v5, Axios, React Router v6 |
| Backend | Node.js, Express, TypeScript, Zod |
| Database | PostgreSQL 16, Knex.js |
| Auth | JWT (access + refresh with rotation), bcryptjs, RBAC |
| Files | Local filesystem (abstraction layer ready for S3 swap) |
| PDF | @react-pdf/renderer (client-side) |
| Dev Tools | ESLint, Prettier, Vitest, Jest, Supertest, Winston, Docker Compose |

---

## Modules

| Module | Features |
|---|---|
| 👥 Employee Records | Profiles, org chart, documents, audit log |
| 💰 Payroll | Salary, allowances/deductions, payroll runs, payslips, tax/NI hooks |
| 🎯 Recruitment | Job requisitions, candidate pipeline, interviews, offer letters, onboarding |
| 📈 Performance | Appraisal cycles, self/manager assessments, OKR goals, dashboard |
| 🏖 Leave & Attendance | Leave types, requests, approval workflow, calendar, clock-in/out |
| 📚 Learning | Course catalogue, enrolments, certificates, learning plans, mandatory alerts |

---

## Quick Start (Local)

### Prerequisites
- Node.js 20+
- PostgreSQL 16 running locally
- npm 10+

### 1. Clone & install

```bash
git clone <repo-url>
cd HCM
npm install
```

### 2. Environment

```bash
cp .env.example .env
# Edit .env with your DB credentials
```

### 3. Migrate & seed

```bash
npm run migrate     # Creates all tables
npm run seed        # Populates 50 employees + demo data
```

### 4. Start dev servers

```bash
npm run dev         # Starts both Express :4000 and Vite :5173
```

Open **http://localhost:5173**

---

## Quick Start (Docker)

```bash
cp .env.example .env
docker compose up -d
docker compose exec app npm run migrate
docker compose exec app npm run seed
```

Open **http://localhost:5173**

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Super Admin | admin@jaxtina.com | Admin@123 |
| HR Manager | manager@jaxtina.com | Manager@123 |
| Line Manager | linemanager@jaxtina.com | Manager@123 |
| Employee | employee@jaxtina.com | Emp@123 |

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | — | Full PostgreSQL connection string (production) |
| `DB_HOST` | localhost | DB hostname |
| `DB_PORT` | 5432 | DB port |
| `DB_NAME` | hcm_db | Database name |
| `DB_USER` | hcm_user | DB user |
| `DB_PASSWORD` | secret | DB password |
| `JWT_SECRET` | — | CHANGE IN PRODUCTION |
| `JWT_EXPIRES_IN` | 8h | Access token lifetime |
| `JWT_REFRESH_EXPIRES_IN` | 7d | Refresh token lifetime |
| `BCRYPT_ROUNDS` | 12 | bcrypt work factor |
| `PORT` | 4000 | Express server port |
| `CLIENT_URL` | http://localhost:5173 | CORS allowed origin |
| `FILE_STORAGE_PATH` | ./uploads | Document storage root |
| `COMPANY_NAME` | Jaxtina Ltd | Company name (used in PDFs) |
| `COMPANY_CURRENCY` | GBP | Default currency |
| `COMPANY_TIMEZONE` | Europe/London | Timezone for calculations |

---

## Project Structure

```
HCM/
├── client/               # React frontend
│   └── src/
│       ├── components/   # Shared UI library
│       ├── contexts/     # Auth context
│       ├── layouts/      # AppLayout
│       ├── modules/      # 6 HCM modules (pages + components per module)
│       ├── pages/        # Auth pages, Dashboard
│       ├── router/       # AppRouter, ProtectedRoute
│       └── services/     # Axios API client
├── server/               # Express API
│   └── src/
│       ├── config/       # env, logger, database
│       ├── db/
│       │   ├── migrations/ # 001–007 Knex migrations
│       │   └── seeds/    # Master seed script
│       ├── middleware/   # authenticate, authorize, validate, errorHandler
│       ├── modules/      # 6 API modules (routes, service, controller, schemas)
│       └── utils/        # response envelope, pagination
├── shared/               # TypeScript types shared between client & server
├── docker-compose.yml
├── Dockerfile
└── .env.example
```

---

## API Reference

Base URL: `http://localhost:4000/api`

All responses follow the envelope:
```json
{ "success": true, "data": {}, "meta": { "page": 1, "limit": 20, "total": 150, "totalPages": 8 } }
```

### Auth
| Method | Path | Auth |
|---|---|---|
| POST | /auth/login | Public |
| POST | /auth/refresh | Public |
| POST | /auth/logout | Public |
| GET | /auth/me | 🔒 Any |
| PUT | /auth/change-password | 🔒 Any |

### Employees
`GET/POST /employees` · `GET/PUT/DELETE /employees/:id` · `GET /employees/org-chart` · `GET/POST /employees/:id/documents` · `GET /employees/:id/audit-log`

### Payroll
`GET/POST /payroll/employees/:id/salary` · `GET /payroll/employees/:id/compensation-history` · `GET/POST /payroll/runs` · `PUT /payroll/runs/:id/status` · `GET /payroll/runs/:runId/payslips/:employeeId`

### Recruitment
`GET/POST /recruitment/requisitions` · `GET/POST /recruitment/candidates` · `PUT /recruitment/candidates/:id/stage` · `POST /recruitment/candidates/:id/interviews` · `POST /recruitment/candidates/:id/offer` · `POST /recruitment/candidates/:id/convert`

### Performance
`GET/POST /performance/cycles` · `GET/POST /performance/appraisals` · `PUT /performance/appraisals/:id/status` · `GET/POST /performance/goals` · `GET /performance/dashboard/:departmentId`

### Leave
`GET/POST /leave/types` · `GET/POST /leave/requests` · `PUT /leave/requests/:id/status` · `GET /leave/balances/:employeeId` · `GET /leave/calendar` · `GET/POST /leave/public-holidays` · `GET /leave/attendance` · `POST /leave/attendance/clock-in` · `POST /leave/attendance/clock-out`

### Learning
`GET/POST /learning/courses` · `POST /learning/courses/:id/enrol` · `PUT /learning/enrolments/:id/status` · `GET /learning/enrolments/:id/certificate` · `GET/POST /learning/plans` · `GET /learning/employees/:id/training-history` · `GET /learning/mandatory-training/alerts`

---

## RBAC Matrix

| Feature | Super Admin | HR Manager | Line Manager | Employee |
|---|---|---|---|---|
| All employees read/write | ✅ | ✅ | Direct reports | Self only |
| Payroll | ✅ | ✅ | ❌ | Own payslips |
| Recruitment | ✅ | ✅ | Read | ❌ |
| Performance | ✅ | ✅ | Team | Self |
| Leave approve | ✅ | ✅ | Direct reports | Submit own |
| Learning admin | ✅ | ✅ | ❌ | Self-enrol |

---

## Running Tests

```bash
npm run test --workspace=server         # Unit tests
npm run test:integration --workspace=server  # API integration tests
npm run test --workspace=client         # Frontend component tests (Vitest)
```

---

## Deployment Notes

1. Set all env variables (especially `JWT_SECRET`, `DATABASE_URL`)
2. Run `npm run migrate` before first boot
3. Run `npm run seed` for demo data (or build your own data)
4. The Docker image serves the Express API which also serves `/uploads` statically
5. For S3 file storage: swap `FILE_STORAGE_PROVIDER=local` → `s3` and fill AWS env vars

---

*Built with ❤️ by Jaxtina Engineering*
