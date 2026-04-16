# Jaxtina HCM — Master TODO

> **Project root:** `C:\Users\cuong\Jaxtina Coding\HCM`
> **Agent skills:** `C:\Users\cuong\Jaxtina Coding\HCM\agent-skills`
> **Stack:** React 18 + TypeScript · Node.js/Express · PostgreSQL/Knex · Tailwind CSS (Nexus palette)
> **Target scale:** ~2,000 employees · 6 HCM modules · JWT-in-memory auth · Docker Compose

***

## PHASE 1 — Project Setup & Monorepo Wiring

- [x] **PHASE-1-01** Setup npm workspaces in root `package.json` mapping `client`, `server`, and `shared` paths
- [x] **PHASE-1-02** Configure root npm scripts for concurrently running dev servers (`npm run dev`)
- [x] **PHASE-1-03** Configure root npm scripts for global execution (`build`, `lint`, `test`, `migrate`, `seed`)
- [x] **PHASE-1-04** Create root `.env.example` defining database URLs and mandatory system tokens
- [x] **PHASE-1-05** Initialize `shared/package.json` specifying common package configurations
- [x] **PHASE-1-06** Establish `shared/src/constants/roles.ts` outlining the `ROLES` access enumeration
- [x] **PHASE-1-07** Define `shared/src/types/auth.ts` documenting authentication interfaces
- [x] **PHASE-1-08** Define `shared/src/types/employee.ts` outlining organizational records
- [x] **PHASE-1-09** Define `shared/src/types/payroll.ts` modeling run schedules and compensation
- [x] **PHASE-1-10** Define `shared/src/types/recruitment.ts` establishing job post and pipeline shapes
- [x] **PHASE-1-11** Define `shared/src/types/performance.ts` capturing OKRs and scoring matrices
- [x] **PHASE-1-12** Define `shared/src/types/leave.ts` logging distinct allowance limits
- [x] **PHASE-1-13** Define `shared/src/types/learning.ts` tracking catalogue entries and completion instances
- [x] **PHASE-1-14** Finalize mapping of `docker-compose.yml` to internal network environment configurations

***

## PHASE 2 — Database Migrations

- [x] **PHASE-2-01** Initialize `knexfile.ts` securely reading root configurations from `.env`
- [x] **PHASE-2-02** Construct `001_auth.ts` — `users` and `refresh_tokens` tables
- [x] **PHASE-2-03** Construct `002_employees.ts` — `employees`, `departments`, `job_titles`, `audit_logs`
- [x] **PHASE-2-04** Construct `003_payroll.ts` — `salary_records`, `allowances`, `deductions`, `payroll_runs`, `payslips`, `tax_rules`
- [x] **PHASE-2-05** Construct `004_recruitment.ts` — `job_requisitions`, `candidates`, `applications`, `interviews`, `offer_letters`, `onboarding_checklists`, `onboarding_tasks`
- [x] **PHASE-2-06** Construct `005_performance.ts` — `appraisal_cycles`, `appraisal_forms`, `appraisal_questions`, `appraisals`, `appraisal_responses`, `goals`, `key_results`
- [x] **PHASE-2-07** Construct `006_leave.ts` — `leave_types`, `leave_entitlements`, `leave_requests`, `leave_balances`, `public_holidays`, `attendance_logs`
- [x] **PHASE-2-08** Construct `007_learning.ts` — `courses`, `course_enrolments`, `learning_plans`, `learning_plan_items`, `certificates`, `mandatory_training`

***

## PHASE 3 — Auth System & Core Middleware

- [ ] **PHASE-3-01** Scaffold `server/src/utils/responseEnvelope.ts` — `{ success, data, meta }` standard response shape
- [ ] **PHASE-3-02** Build `server/src/utils/pagination.ts` — parse `page`/`limit` from query string, build meta
- [ ] **PHASE-3-03** Formulate `server/src/utils/fileStorage.ts` — abstraction layer with local `fs` implementation; S3 stub
- [ ] **PHASE-3-04** Deploy `server/src/middleware/errorHandler.ts` — ZodError → 400, JWT error → 401, default → 500
- [ ] **PHASE-3-05** Deploy `server/src/middleware/authenticate.ts` — verify JWT, attach `req.user`
- [ ] **PHASE-3-06** Deploy `server/src/middleware/authorize.ts` — variadic role args against `ROLES` constants
- [ ] **PHASE-3-14** Bind auth routes into `server/src/app.ts` — mount under `/api/auth`
- [ ] **PHASE-3-07** Deploy `server/src/middleware/validate.ts` — Zod schema wrapper, field-level 400 errors
- [ ] **PHASE-3-08** Deploy `server/src/middleware/paginate.ts` — enforce hard limit (max 100) on GET list queries
- [ ] **PHASE-3-09** Deploy `server/src/middleware/rateLimiter.ts` — 10 req / 15 min / IP on `/api/auth` surfaces
- [ ] **PHASE-3-10** Implement `auth.schemas.ts` — Zod schemas for login, register, refresh, password-change
- [ ] **PHASE-3-11** Construct `auth.service.ts` — bcrypt compare, JWT sign/verify, refresh token DB logic
- [ ] **PHASE-3-12** Setup `auth.controller.ts` — login, logout, refresh, me endpoints
- [ ] **PHASE-3-13** Wire `auth.routes.ts` — Express router verbs to controller actions

***

## PHASE 4 — Full API Route Inventory

### Employees
- [ ] **PHASE-4-01** Compose `employee.schemas.ts` — create/update Zod schemas including employment type enum
- [ ] **PHASE-4-02** Build `employee.service.ts` — CRUD, org tree builder, document upload, audit log writer
- [ ] **PHASE-4-03** Assemble `employee.controller.ts` — paginated list, profile, org chart, audit log endpoints
- [ ] **PHASE-4-04** Connect `employee.routes.ts` — `/employees`, `/employees/:id`, `/employees/:id/documents`, `/org-chart`, `/audit-log`

### Payroll
- [ ] **PHASE-4-05** Compose `payroll.schemas.ts` — salary record, allowance, deduction, payroll run schemas
- [ ] **PHASE-4-06** Build `payroll.service.ts` — lifecycle state machine (draft→reviewed→approved→paid), payslip generation, tax rule application
- [ ] **PHASE-4-07** Assemble `payroll.controller.ts` — run management, payslip fetch, compensation history
- [ ] **PHASE-4-08** Connect `payroll.routes.ts` — `/payroll/runs`, `/payroll/runs/:id/advance`, `/payroll/salary/:employeeId`, `/payroll/payslips/:id`

### Recruitment
- [ ] **PHASE-4-09** Compose `recruitment.schemas.ts` — requisition, candidate, application stage transition schemas
- [ ] **PHASE-4-10** Build `recruitment.service.ts` — pipeline stage transitions, candidate→employee conversion, onboarding checklist generation
- [ ] **PHASE-4-11** Assemble `recruitment.controller.ts` — requisition CRUD, candidate pipeline, interview logging, offer letter
- [ ] **PHASE-4-12** Connect `recruitment.routes.ts` — `/recruitment/requisitions`, `/recruitment/candidates`, `/recruitment/candidates/:id/convert`, `/recruitment/onboarding`

### Performance
- [ ] **PHASE-4-13** Compose `performance.schemas.ts` — cycle, appraisal form, goal, key result schemas
- [ ] **PHASE-4-14** Build `performance.service.ts` — appraisal workflow, goal % recalculation in service layer (Knex transaction), department aggregations
- [ ] **PHASE-4-15** Assemble `performance.controller.ts` — cycle management, self/manager assessment, OKR CRUD, department dashboard data
- [ ] **PHASE-4-16** Connect `performance.routes.ts` — `/performance/cycles`, `/performance/appraisals`, `/performance/goals`, `/performance/dashboard`

### Leave
- [ ] **PHASE-4-17** Compose `leave.schemas.ts` — leave type, request (with date overlap validation), entitlement schemas
- [ ] **PHASE-4-18** Build `leave.service.ts` — balance tracking (Knex transaction), accrual logic, overlap detection, clock-in/out
- [ ] **PHASE-4-19** Assemble `leave.controller.ts` — request workflow, team calendar, balance overview, attendance log + CSV export
- [ ] **PHASE-4-20** Connect `leave.routes.ts` — `/leave/requests`, `/leave/balance`, `/leave/calendar`, `/leave/attendance`, `/leave/attendance/export`

### Learning
- [ ] **PHASE-4-21** Compose `learning.schemas.ts` — course, enrolment, learning plan, mandatory training schemas
- [ ] **PHASE-4-22** Build `learning.service.ts` — enrolment status progression, mandatory training expiry alerts, certificate number generation
- [ ] **PHASE-4-23** Assemble `learning.controller.ts` — catalogue CRUD, enrolment management, learning plan builder, certificate generation trigger
- [ ] **PHASE-4-24** Connect `learning.routes.ts` — `/learning/courses`, `/learning/enrolments`, `/learning/plans`, `/learning/mandatory`, `/learning/certificates/:id`

***

## PHASE 5 — Frontend Shell & Components

### Infrastructure
- [ ] **PHASE-5-01** Boot Vite + React 18 + TypeScript — confirm `npm run dev` on `:5173` with zero console errors
- [ ] **PHASE-5-02** Standardize `tailwind.config.ts` — Nexus design tokens, dark mode class strategy, font families
- [ ] **PHASE-5-03** Construct `services/api.ts` — Axios instance, `Authorization` header injection, 401 refresh interceptor, logout on refresh failure
- [ ] **PHASE-5-04** Scaffold `contexts/AuthContext.tsx` — in-memory JWT, user state, login/logout actions, `useAuth` hook
- [ ] **PHASE-5-05** Scaffold `contexts/ThemeContext.tsx` — dark/light toggle, `data-theme` on `<html>`, system preference default
- [ ] **PHASE-5-06** Establish `router/ProtectedRoute.tsx` — redirect unauthenticated users to `/login`
- [ ] **PHASE-5-07** Establish `router/RoleGuard.tsx` — render `<Page403>` for insufficient role; accept `allowedRoles` prop

### Layouts
- [ ] **PHASE-5-08** Build `layouts/Sidebar.tsx` — 240px fixed, icon-only at ≤1024px, active route highlight, module nav groups
- [ ] **PHASE-5-09** Build `layouts/Topbar.tsx` — global search, dark-mode toggle, notification bell, user avatar dropdown
- [ ] **PHASE-5-10** Build `layouts/AppLayout.tsx` — sidebar + topbar shell, `<Outlet>` for module pages, single scroll region

### Shared Components
- [ ] **PHASE-5-11** Build `Button` — variants: primary, secondary, ghost, danger; sizes: sm, md, lg; loading spinner state
- [ ] **PHASE-5-12** Build `Modal` — focus trap, Escape dismiss, backdrop click dismiss, `title` + `children` + `footer` slots
- [ ] **PHASE-5-13** Build `Table` — sortable columns, row selection, pagination controls, empty state slot
- [ ] **PHASE-5-14** Build `Form` — `react-hook-form` + Zod `zodResolver` wrapper, error display per field
- [ ] **PHASE-5-15** Build `Input` — label, placeholder, error message, disabled, prefix/suffix icon slots
- [ ] **PHASE-5-16** Build `Select` — searchable dropdown, `options: { value, label }[]`, multi-select variant
- [ ] **PHASE-5-17** Build `Badge` — variants mapped to semantic colours: success, warning, error, info, neutral
- [ ] **PHASE-5-18** Build `Avatar` — image with text fallback (initials), sizes: sm/md/lg, online indicator dot
- [ ] **PHASE-5-19** Build `PageHeader` — title (H1), optional subtitle, breadcrumb trail, action slot (right-aligned)
- [ ] **PHASE-5-20** Build `EmptyState` — Lucide icon, heading, description, optional primary action button
- [ ] **PHASE-5-21** Build `Skeleton` — shimmer animation using `--color-surface-offset`/`--color-surface-dynamic`; text, heading, avatar, image variants
- [ ] **PHASE-5-22** Build `Tabs` — controlled and uncontrolled modes, keyboard navigation (arrow keys), `TabPanel` content slots
- [ ] **PHASE-5-23** Build `DatePicker` — native `<input type="date">` with styled wrapper; range variant for leave requests
- [ ] **PHASE-5-24** Build `FileUpload` — drag-and-drop zone, file type/size validation, preview thumbnails, `onUpload` callback
- [ ] **PHASE-5-25** Build `ConfirmDialog` — wraps `Modal`, danger-variant confirm button, `onConfirm`/`onCancel` callbacks
- [ ] **PHASE-5-26** Build `Toast` — top-right stack, auto-dismiss (4 s default), variants: success/error/warning/info, `useToast` hook
- [ ] **PHASE-5-27** Build `KpiCard` — metric value, label, trend indicator (↑↓), percentage delta, optional sparkline slot

### Pages & Router
- [ ] **PHASE-5-28** Build `pages/LoginPage.tsx` — email/password form, auth mutation, redirect to `/dashboard` on success
- [ ] **PHASE-5-29** Build `pages/Page403.tsx` — "Access denied" message, back button, role display
- [ ] **PHASE-5-30** Build `pages/Page404.tsx` — "Page not found" message, home button
- [ ] **PHASE-5-31** Configure `router/AppRouter.tsx` — all routes declared, lazy-loaded module pages, `ProtectedRoute` + `RoleGuard` wrappers

***

## PHASE 6 — Frontend Module Pages

### Employees
- [ ] **PHASE-6-01** Build `EmployeeListPage` — searchable/filterable table, status badge, link to profile
- [ ] **PHASE-6-02** Build `EmployeeProfilePage` — tabbed layout: Personal · Employment · Documents · Audit Log
- [ ] **PHASE-6-03** Build `OrgChartPage` — `@xyflow/react` tree by department/reporting line, zoom + pan controls
- [ ] **PHASE-6-04** Build `EmployeeFormPage` — multi-step form (3 steps): Personal → Employment → Review
- [ ] **PHASE-6-05** Build `DepartmentListPage` — list with headcount, inline edit department name/head

### Payroll
- [ ] **PHASE-6-06** Build `PayrollDashboardPage` — KPI cards (total headcount, total payroll cost, pending runs), recent payslips list
- [ ] **PHASE-6-07** Build `PayrollRunsPage` — paginated table of runs with status badge, create new run action
- [ ] **PHASE-6-08** Build `PayrollRunDetailPage` — run summary, employee payslip list, advance-stage button (RBAC gated)
- [ ] **PHASE-6-09** Build `SalaryPage` — employee salary timeline chart (Recharts), compensation history table
- [ ] **PHASE-6-10** Build `TaxRulesPage` — configurable tax bracket table, CRUD for `tax_rules` rows (HR Manager only)

### Recruitment
- [ ] **PHASE-6-11** Build `RequisitionsPage` — job requisition list with status, create requisition form modal
- [ ] **PHASE-6-12** Build `CandidatePipelinePage` — `@dnd-kit` Kanban board across 6 stages, drag to transition
- [ ] **PHASE-6-13** Build `CandidateDetailPage` — profile, application timeline, interview notes, offer letter trigger
- [ ] **PHASE-6-14** Build `OnboardingPage` — new hire checklist with task completion checkboxes, progress bar

### Performance
- [ ] **PHASE-6-15** Build `AppraisalCyclesPage` — cycle list, create cycle modal, status badges
- [ ] **PHASE-6-16** Build `AppraisalFormPage` — question-by-question form, rating input, save-as-draft + submit actions
- [ ] **PHASE-6-17** Build `GoalsPage` — OKR list, add goal modal, key result progress bars, inline % update
- [ ] **PHASE-6-18** Build `PerformanceDashboardPage` — department completion rate charts (Recharts bar), average rating distribution

### Leave
- [ ] **PHASE-6-19** Build `LeaveCalendarPage` — monthly calendar grid, team absence overlay, public holidays highlighted
- [ ] **PHASE-6-20** Build `LeaveRequestPage` — date range picker, leave type select, balance preview, submit action
- [ ] **PHASE-6-21** Build `LeaveAdminPage` — manager approval queue table, approve/reject actions, bulk actions
- [ ] **PHASE-6-22** Build `AttendancePage` — clock-in/out button, daily log table, CSV export button
- [ ] **PHASE-6-23** Build `PublicHolidaysPage` — configurable holiday list by region/year (HR Manager only)

### Learning
- [ ] **PHASE-6-24** Build `CourseCataloguePage` — card grid with type badge, duration, enrol button
- [ ] **PHASE-6-25** Build `CourseDetailPage` — description, provider, enrolment status, enrol/withdraw action
- [ ] **PHASE-6-26** Build `MyLearningPage` — enrolled courses with progress status, certificate download links
- [ ] **PHASE-6-27** Build `LearningPlanPage` — `@dnd-kit/sortable` reorderable course list, assign to role/employee
- [ ] **PHASE-6-28** Build `MandatoryTrainingPage` — traffic-light status table (current/expiring soon/overdue), renewal alerts

***

## PHASE 7 — PDF Documents

- [ ] **PHASE-7-01** Implement `PayslipDocument.tsx` — `@react-pdf/renderer` layout: header, pay period, gross/deductions/net breakdown, footer
- [ ] **PHASE-7-02** Implement `PayslipPreviewModal` — `PDFViewer` inside Modal with download button
- [ ] **PHASE-7-03** Implement `OfferLetterDocument.tsx` — company header, candidate name, role, salary, start date, template body, signature block
- [ ] **PHASE-7-04** Implement `OfferLetterModal` — preview + download, triggered from `CandidateDetailPage`
- [ ] **PHASE-7-05** Implement `CertificateDocument.tsx` — decorative border, employee name, course name, completion date, unique certificate number
- [ ] **PHASE-7-06** Implement `CertificatePreviewModal` — preview + download, triggered from `MyLearningPage`

***

## PHASE 8 — Seed Data

- [ ] **PHASE-8-01** Build `00_truncate.ts` — truncate all tables in reverse FK order
- [ ] **PHASE-8-02** Build `01_roles.ts` — insert 4 roles (super_admin, hr_manager, line_manager, employee)
- [ ] **PHASE-8-03** Build `02_departments.ts` — insert 5 departments (Engineering, Sales, HR, Finance, Operations)
- [ ] **PHASE-8-04** Build `03_job_titles.ts` — insert 15–20 job titles across departments
- [ ] **PHASE-8-05** Build `04_users.ts` — insert 4 demo users (one per role), bcrypt-hashed passwords
- [ ] **PHASE-8-06** Build `05_employees.ts` — insert 50+ employees across 5 departments with realistic names and reporting lines
- [ ] **PHASE-8-07** Build `06_payroll.ts` — salary records, allowances, deductions, 2 completed payroll runs, payslips
- [ ] **PHASE-8-08** Build `07_recruitment.ts` — 3 open requisitions, 15 candidates at various pipeline stages, 2 offer letters
- [ ] **PHASE-8-09** Build `08_performance.ts` — 1 active appraisal cycle, 30 appraisals (mix of statuses), 20 goals with key results
- [ ] **PHASE-8-10** Build `09_leave.ts` — leave types, entitlements, 25 leave requests (approved/pending/rejected), attendance logs
- [ ] **PHASE-8-11** Build `10_learning.ts` — 10 courses, 40 enrolments, 2 learning plans, mandatory training records with expiry dates

***

## PHASE 9 — Testing

### Unit Tests (server)
- [ ] **PHASE-9-01** Write `auth.service.test.ts` — JWT sign/verify, bcrypt compare, refresh token creation/revocation
- [ ] **PHASE-9-02** Write `payroll.service.test.ts` — lifecycle state transitions, tax rule application, payslip calculation
- [ ] **PHASE-9-03** Write `leave.service.test.ts` — overlap detection, balance deduction, accrual calculation

### API Integration Tests (server)
- [ ] **PHASE-9-04** `/auth` — login success, login failure, token refresh, logout
- [ ] **PHASE-9-05** `/employees` — list (paginated), get by ID, create (HR Manager only), update, soft-delete
- [ ] **PHASE-9-06** `/payroll` — create run, advance stage, reject invalid transition, fetch payslip
- [ ] **PHASE-9-07** `/recruitment` — create requisition, move candidate stage, convert to employee
- [ ] **PHASE-9-08** `/performance` — create cycle, submit appraisal, acknowledge review
- [ ] **PHASE-9-10** `/leave` — submit request, approve (manager), reject, overlap collision returns 409
- [ ] **PHASE-9-11** `/learning` — enrol, advance status, complete and trigger certificate generation

### Component Tests (client)
- [ ] **PHASE-9-12** `Button.test.tsx` — renders variants, fires onClick, shows spinner in loading state, disabled blocks click
- [ ] **PHASE-9-13** `Modal.test.tsx` — opens/closes, Escape key closes, backdrop click closes, focus trapped inside
- [ ] **PHASE-9-14** `Table.test.tsx` — renders rows, pagination controls, sort column header click, empty state slot
- [ ] **PHASE-9-15** `Form.test.tsx` — Zod validation errors display per field, submit fires with valid data
- [ ] **PHASE-9-16** `Badge.test.tsx` — correct colour class per variant, renders label text
- [ ] **PHASE-9-17** `Skeleton.test.tsx` — renders correct shape per variant (text, heading, avatar, image), shimmer class present
- [ ] **PHASE-9-18** `EmployeeListPage.test.tsx` — TanStack Query mock returns data, table rows rendered, search filters list
- [ ] **PHASE-9-19** `LeaveRequestPage.test.tsx` — form submission triggers API mutation, validation errors shown, balance preview updates on leave type change

***

*Last updated: Phase 0 (plan review) complete. Ready to execute Phase 1.*
