# Jaxtina HCM

> Full-stack Human Capital Management system built with
> React 18, Node.js/Express, PostgreSQL, and TypeScript.

## Features
- **Core HR**: Employee profiles, document management, organizational charts, and audit logs.
- **Payroll**: Salary records, automated tax calculations, payroll runs, and PDF payslip generation.
- **Recruitment**: Job requisitions, candidate pipeline (Kanban), interview logging, and offer letter generation.
- **Performance**: OKRs (Goals & Key Results), appraisal cycles, and performance dashboards.
- **Leave & Attendance**: Leave request workflow, absence calendar, clock-in/out, and attendance exporting.
- **Learning**: Course catalogue, enrolment tracking, learning plans, and certificate generation.
- **Security**: RBAC (Role-Based Access Control), JWT authentication, and structured logging.

## Tech Stack
| Layer | Technology |
| :--- | :--- |
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, TanStack Query |
| Backend | Node.js, Express, TypeScript, Knex.js |
| Database | PostgreSQL 16 |
| Auth | JWT (access) + httpOnly refresh token |
| PDF | @react-pdf/renderer |
| Charts | Recharts |
| Org Chart | @xyflow/react |
| Kanban | @dnd-kit |

## Quick Start (Local Development)

### Prerequisites
- Node.js 20+
- PostgreSQL 16 running locally (or Docker)
- npm 10+

### Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/cuonglhv-code/jax-hcm.git
   cd jax-hcm
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment:
   ```bash
   cp server/.env.example server/.env
   # Edit server/.env: set DATABASE_URL and JWT_SECRET
   ```

4. Build shared package:
   ```bash
   cd shared && npm run build && cd ..
   ```

5. Run database migrations and seed:
   ```bash
   cd server
   npm run migrate
   npm run seed
   cd ..
   ```

6. Start development servers:
   ```bash
   npm run dev
   ```

### Default Accounts (after seeding)
| Role | Email | Password |
| :--- | :--- | :--- |
| Super Admin | admin@jaxtina.com | Admin123! |
| HR Manager | hr1@jaxtina.com | HrPass1! |
| Line Manager | manager1@jaxtina.com | MgrPass1! |
| Employee | emp1@jaxtina.com | EmpPass1! |

## Docker (full stack)

1. Configure environment:
   ```bash
   cp .env.example .env   # set JWT_SECRET at minimum
   ```

2. Launch stack:
   ```bash
   docker-compose up -d --build
   ```
   - App: http://localhost:4000
   - After first boot: `docker-compose exec app node server/dist/db/migrate.js` (Note: adjust path as needed)

## Running Tests
```bash
# Individual packages
cd server && npm test
cd client && npm test

# Via Makefile
make test
```

## Project Structure
- `/client`: React 18 SPA (Vite)
- `/server`: Express API (Node.js)
- `/shared`: Shared TypeScript types and constants
- `/tasks`: Project planning and TODO tracking
- `/scripts`: DB init scripts

## API Reference
Base URL: `http://localhost:4000/api`

- **Auth**: `POST /auth/login`, `/auth/logout`, `/auth/refresh`, `GET /auth/me`
- **Employees**: CRUD `/employees`, `/departments`, `/job-titles`, `/org-chart`
- **Payroll**: `/payroll/runs`, `/payroll/salary`, `/payroll/payslips/:id/pdf`
- **Recruitment**: `/recruitment/requisitions`, `/candidates`, `/applications`
- **Performance**: `/performance/cycles`, `/appraisals`, `/goals`
- **Leave**: `/leave/requests`, `/leave/balance`, `/leave/attendance`
- **Learning**: `/learning/courses`, `/enrolments`, `/certificates`
- **Search**: `GET /search?q=`
- **Admin**: `/admin/stats`, `/admin/users` (super_admin only)
