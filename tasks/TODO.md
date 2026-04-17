# Jaxtina HCM — Master TODO

> **Project root:** `C:\Users\cuong\Jaxtina Coding\HCM`
> **Agent skills:** `C:\Users\cuong\Jaxtina Coding\HCM\agent-skills`
> **Stack:** React 18 + TypeScript · Node.js/Express · PostgreSQL/Knex · Tailwind CSS (Nexus palette)

***

## PHASE 1 — Project Setup & Monorepo Wiring
- [x] **PHASE-1-01** Setup npm workspaces in root `package.json`
- [x] **PHASE-1-02** Configure root npm scripts for concurrently running dev servers
- [x] **PHASE-1-03** Configure root npm scripts for global execution
- [x] **PHASE-1-04** Create root `.env.example` defining database URLs
- [x] **PHASE-1-05** Initialize `shared/package.json`
- [x] **PHASE-1-06** Establish `shared/src/constants/roles.ts`
- [x] **PHASE-1-07** Define `shared/src/types/auth.ts`
- [x] **PHASE-1-08** Define `shared/src/types/employee.ts`
- [x] **PHASE-1-09** Define `shared/src/types/payroll.ts`
- [x] **PHASE-1-10** Define `shared/src/types/recruitment.ts`
- [x] **PHASE-1-11** Define `shared/src/types/performance.ts`
- [x] **PHASE-1-12** Define `shared/src/types/leave.ts`
- [x] **PHASE-1-13** Define `shared/src/types/learning.ts`
- [x] **PHASE-1-14** Finalize mapping of `docker-compose.yml`

***

## PHASE 2 — Database Migrations
- [x] **PHASE-2-01** Initialize `knexfile.ts`
- [x] **PHASE-2-02** Construct `001_auth.ts`
- [x] **PHASE-2-03** Construct `002_employees.ts`
- [x] **PHASE-2-04** Construct `003_payroll.ts`
- [x] **PHASE-2-05** Construct `004_recruitment.ts`
- [x] **PHASE-2-06** Construct `005_performance.ts`
- [x] **PHASE-2-07** Construct `006_leave.ts`
- [x] **PHASE-2-08** Construct `007_learning.ts`

***

## PHASE 3 — Auth System & Core Middleware
- [x] **PHASE-3-01** Scaffold `server/src/utils/responseEnvelope.ts`
- [x] **PHASE-3-02** Build `server/src/utils/pagination.ts`
- [x] **PHASE-3-03** Formulate `server/src/utils/fileStorage.ts`
- [x] **PHASE-3-04** Deploy `server/src/middleware/errorHandler.ts`
- [x] **PHASE-3-05** Deploy `server/src/middleware/authenticate.ts`
- [x] **PHASE-3-06** Deploy `server/src/middleware/authorize.ts`
- [x] **PHASE-3-14** Bind auth routes into `server/src/app.ts`
- [x] **PHASE-3-07** Deploy `server/src/middleware/validate.ts`
- [x] **PHASE-3-08** Deploy `server/src/middleware/paginate.ts`
- [x] **PHASE-3-09** Deploy `server/src/middleware/rateLimiter.ts`
- [x] **PHASE-3-10** Implement `auth.schemas.ts`
- [x] **PHASE-3-11** Construct `auth.service.ts`
- [x] **PHASE-3-12** Setup `auth.controller.ts`
- [x] **PHASE-3-13** Wire `auth.routes.ts`

***

## PHASE 4 — Full API Route Inventory
- [x] **PHASE-4-01** compose employee schemas
- [x] **PHASE-4-02** build employee service
- [x] **PHASE-4-03** assemble employee controller
- [x] **PHASE-4-04** connect employee routes
- [x] **PHASE-4-05** compose payroll schemas
- [x] **PHASE-4-06** build payroll service
- [x] **PHASE-4-07** assemble payroll controller
- [x] **PHASE-4-08** connect payroll routes
- [x] **PHASE-4-09** compose recruitment schemas
- [x] **PHASE-4-10** build recruitment service
- [x] **PHASE-4-11** assemble recruitment controller
- [x] **PHASE-4-12** connect recruitment routes
- [x] **PHASE-4-13** compose performance schemas
- [x] **PHASE-4-14** build performance service
- [x] **PHASE-4-15** assemble performance controller
- [x] **PHASE-4-16** connect performance routes
- [x] **PHASE-4-17** compose leave schemas
- [x] **PHASE-4-18** build leave service
- [x] **PHASE-4-19** assemble leave controller
- [x] **PHASE-4-20** connect leave routes
- [x] **PHASE-4-21** compose learning schemas
- [x] **PHASE-4-22** build learning service
- [x] **PHASE-4-23** assemble learning controller
- [x] **PHASE-4-24** connect learning routes

***

## PHASE 5 — Frontend Infrastructure
- [x] **PHASE-5-01** Boot Vite + React 18
- [x] **PHASE-5-02** Standardize `tailwind.config.ts`
- [x] **PHASE-5-03** Construct `services/api.ts`
- [x] **PHASE-5-04** Scaffold `contexts/AuthContext.tsx`
- [x] **PHASE-5-05** Scaffold `contexts/ThemeContext.tsx`
- [x] **PHASE-5-06** Establish `router/ProtectedRoute.tsx`
- [x] **PHASE-5-07** Establish `router/RoleGuard.tsx`
- [x] **PHASE-5-08** Build `layouts/Sidebar.tsx`
- [x] **PHASE-5-09** Build `layouts/Topbar.tsx`
- [x] **PHASE-5-10** Build `layouts/AppLayout.tsx`
- [x] **PHASE-5-11** Build `Button`
- [x] **PHASE-5-12** Build `Modal`
- [x] **PHASE-5-13** Build `Table`
- [x] **PHASE-5-14** Build `Form`
- [x] **PHASE-5-15** Build `Input`
- [x] **PHASE-5-16** Build `Select`
- [x] **PHASE-5-17** Build `Badge`
- [x] **PHASE-5-18** Build `Avatar`
- [x] **PHASE-5-19** Build `PageHeader`
- [x] **PHASE-5-20** Build `EmptyState`
- [x] **PHASE-5-21** Build `Skeleton`
- [x] **PHASE-5-22** Build `Tabs`
- [x] **PHASE-5-23** Build `DatePicker`
- [x] **PHASE-5-24** Build `FileUpload`
- [x] **PHASE-5-25** Build `ConfirmDialog`
- [x] **PHASE-5-26** Build `Toast`
- [x] **PHASE-5-27** Build `KpiCard`
- [x] **PHASE-5-28** Build `LoginPage`
- [x] **PHASE-5-29** Build `Page403`
- [x] **PHASE-5-30** Build `Page404`
- [x] **PHASE-5-31** Configure `AppRouter`

***

## PHASE 6 — Feature Module Pages
- [x] **PHASE-6-01** Build `EmployeeListPage`
- [x] **PHASE-6-02** Build `EmployeeProfilePage`
- [x] **PHASE-6-03** Build `OrgChartPage`
- [x] **PHASE-6-04** Build `EmployeeFormPage`
- [x] **PHASE-6-05** Build `DepartmentListPage`
- [x] **PHASE-6-06** Build `PayrollDashboardPage`
- [x] **PHASE-6-07** Build `PayrollRunsPage`
- [x] **PHASE-6-08** Build `PayrollRunDetailPage`
- [x] **PHASE-6-09** Build `PayslipPage`
- [x] **PHASE-6-10** Build `TaxRulesPage`
- [x] **PHASE-6-11** Build `RequisitionsPage`
- [x] **PHASE-6-12** Build `CandidatePipelinePage`
- [x] **PHASE-6-13** Build `CandidateDetailPage`
- [x] **PHASE-6-14** Build `OnboardingPage`
- [x] **PHASE-6-15** Build `AppraisalCyclesPage`
- [x] **PHASE-6-17** Build `GoalsPage`
- [x] **PHASE-6-18** Build `PerformanceDashboardPage`
- [x] **PHASE-6-19** Build `LeaveCalendarPage`
- [x] **PHASE-6-20** Build `LeaveRequestPage`
- [x] **PHASE-6-21** Build `LeaveAdminPage`
- [x] **PHASE-6-22** Build `AttendancePage`
- [x] **PHASE-6-23** Build `PublicHolidaysPage`
- [x] **PHASE-6-24** Build `CourseCataloguePage`
- [x] **PHASE-6-25** Build `CourseDetailPage`
- [x] **PHASE-6-26** Build `MyLearningPage`
- [x] **PHASE-6-27** Build `LearningPlanPage`
- [x] **PHASE-6-28** Build `MandatoryTrainingPage`

***

## PHASE 7 — PDF & Extra Features
- [x] **PHASE-7-01** Implement `PayslipDocument.tsx`
- [x] **PHASE-7-02** Implement `PayslipPreviewModal`
- [x] **PHASE-7-03** Implement `OfferLetterDocument.tsx`
- [x] **PHASE-7-04** Implement `OfferLetterModal`
- [x] **PHASE-7-05** Implement `CertificateDocument.tsx`
- [x] **PHASE-7-06** Implement `CertificatePreviewModal`

***

## PHASE 8 — Seed Data
- [x] **PHASE-8-01** Build `00_truncate.ts`
- [x] **PHASE-8-02** Build `01_roles.ts`
- [x] **PHASE-8-03** Build `02_departments.ts`
- [x] **PHASE-8-04** Build `03_job_titles.ts`
- [x] **PHASE-8-05** Build `04_users.ts`
- [x] **PHASE-8-06** Build `05_employees.ts`
- [x] **PHASE-8-07** Build `06_payroll.ts`
- [x] **PHASE-8-08** Build `07_recruitment.ts`
- [x] **PHASE-8-09** Build `08_performance.ts`
- [x] **PHASE-8-10** Build `09_leave.ts`
- [x] **PHASE-8-11** Build `10_learning.ts`

***

## PHASE 9 — Testing Infrastructure
- [x] **PHASE-9-01** Auth Integration Tests
- [x] **PHASE-9-02** Employee Integration Tests
- [x] **PHASE-9-03** Payroll Integration Tests
- [x] **PHASE-9-04** Leave Integration Tests
- [x] **PHASE-9-05** Recruitment Integration Tests
- [x] **PHASE-9-06** Performance Integration Tests
- [x] **PHASE-9-07** Learning Integration Tests
- [x] **PHASE-9-08** Search Integration Tests
- [x] **PHASE-9-09** Notifications Integration Tests
- [x] **PHASE-9-10** Admin Integration Tests
- [x] **PHASE-9-11** Unit: `auth.service`
- [x] **PHASE-9-12** Unit: `leave.service`
- [x] **PHASE-9-13** Unit: `pagination`
- [x] **PHASE-9-14** Unit: `responseEnvelope`
- [x] **PHASE-9-15** Client: `Button` component tests
- [x] **PHASE-9-16** Client: `Table` component tests
- [x] **PHASE-9-17** Client: `Modal` component tests
- [x] **PHASE-9-18** Client: `KpiCard` component tests
- [x] **PHASE-9-19** Client: `useEmployees` hook tests
- [x] **PHASE-9-20** Final verification (70% coverage)

***

## PHASE 10 — Production Hardening & Documentation
- [x] **PHASE-10-01** Update `.env.example`
- [x] **PHASE-10-02** Implement validated `env.ts` config with Zod
- [x] **PHASE-10-03** Hardened Helmet + CORS policy in `app.ts`
- [x] **PHASE-10-04** Request size limits & file upload protection
- [x] **PHASE-10-05** Implement graceful shutdown (SIGTERM/SIGINT)
- [x] **PHASE-10-06** Multi-stage production `Dockerfile`
- [x] **PHASE-10-07** SPA fallback for production client serving
- [x] **PHASE-10-08** Production-ready `docker-compose.yml`
- [x] **PHASE-10-09** Create `scripts/init-db.sql` for Docker hook
- [x] **PHASE-10-10** Build project root `Makefile` for shortcuts
- [x] **PHASE-10-11** Configure GitHub Actions CI workflow
- [x] **PHASE-10-12** Configure GitHub Actions Deploy workflow
- [x] **PHASE-10-13** Switch to structured logging with `pino`
- [x] **PHASE-10-14** Extend `/health` endpoint with system status
- [x] **PHASE-10-15** Comprehensive `README.md` documentation
- [x] **PHASE-10-16** Final status update in `TODO.md`
- [x] **PHASE-10-17** local smoke test verification
- [x] **PHASE-10-18** Docker smoke test verification
- [x] **PHASE-10-19** Total TypeScript zero-error check
- [x] **PHASE-10-20** Final version tag `v1.0.0`

***

## 🎉 PROJECT COMPLETE

All 10 phases delivered. Project v1.0.0 ready.
*Last updated: Phase 10 complete.*
