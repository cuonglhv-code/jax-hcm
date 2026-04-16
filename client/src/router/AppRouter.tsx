import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AppLayout } from '../layouts/AppLayout';

// Auth
import { LoginPage } from '../pages/auth/LoginPage';
import { Page403 } from '../pages/auth/Page403';
import { Page404 } from '../pages/auth/Page403';

// Lazy load module pages
const DashboardPage = lazy(() => import('../pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const EmployeeListPage = lazy(() => import('../modules/employees/pages/EmployeeListPage').then(m => ({ default: m.EmployeeListPage })));
const EmployeeProfilePage = lazy(() => import('../modules/employees/pages/EmployeeProfilePage').then(m => ({ default: m.EmployeeProfilePage })));
const OrgChartPage = lazy(() => import('../modules/employees/pages/OrgChartPage').then(m => ({ default: m.OrgChartPage })));
const PayrollRunsPage = lazy(() => import('../modules/payroll/pages/PayrollRunsPage').then(m => ({ default: m.PayrollRunsPage })));
const RequisitionsPage = lazy(() => import('../modules/recruitment/pages/RequisitionsPage').then(m => ({ default: m.RequisitionsPage })));
const CandidatePipelinePage = lazy(() => import('../modules/recruitment/pages/CandidatePipelinePage').then(m => ({ default: m.CandidatePipelinePage })));
const AppraisalCyclesPage = lazy(() => import('../modules/performance/pages/AppraisalCyclesPage').then(m => ({ default: m.AppraisalCyclesPage })));
const GoalsPage = lazy(() => import('../modules/performance/pages/GoalsPage').then(m => ({ default: m.GoalsPage })));
const LeaveCalendarPage = lazy(() => import('../modules/leave/pages/LeaveCalendarPage').then(m => ({ default: m.LeaveCalendarPage })));
const LeaveRequestsPage = lazy(() => import('../modules/leave/pages/LeaveRequestsPage').then(m => ({ default: m.LeaveRequestsPage })));
const CourseCataloguePage = lazy(() => import('../modules/learning/pages/CourseCataloguePage').then(m => ({ default: m.CourseCataloguePage })));
const LearningPlanPage = lazy(() => import('../modules/learning/pages/LearningPlanPage').then(m => ({ default: m.LearningPlanPage })));

const PageSuspense = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="size-8 rounded-full border-4 border-brand-500 border-t-transparent animate-spin" />
    </div>
  }>
    {children}
  </Suspense>
);

export function AppRouter() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/403" element={<Page403 />} />
      <Route path="/404" element={<Page404 />} />

      {/* Protected app shell */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<PageSuspense><DashboardPage /></PageSuspense>} />

          {/* Employees */}
          <Route path="employees" element={<PageSuspense><EmployeeListPage /></PageSuspense>} />
          <Route path="employees/org-chart" element={<PageSuspense><OrgChartPage /></PageSuspense>} />
          <Route path="employees/:id" element={<PageSuspense><EmployeeProfilePage /></PageSuspense>} />

          {/* Payroll — HR+ only */}
          <Route element={<ProtectedRoute allowedRoles={['super_admin', 'hr_manager']} />}>
            <Route path="payroll" element={<PageSuspense><PayrollRunsPage /></PageSuspense>} />
          </Route>

          {/* Recruitment */}
          <Route path="recruitment" element={<PageSuspense><RequisitionsPage /></PageSuspense>} />
          <Route path="recruitment/:id/pipeline" element={<PageSuspense><CandidatePipelinePage /></PageSuspense>} />

          {/* Performance */}
          <Route path="performance" element={<PageSuspense><AppraisalCyclesPage /></PageSuspense>} />
          <Route path="performance/goals" element={<PageSuspense><GoalsPage /></PageSuspense>} />

          {/* Leave */}
          <Route path="leave" element={<PageSuspense><LeaveCalendarPage /></PageSuspense>} />
          <Route path="leave/requests" element={<PageSuspense><LeaveRequestsPage /></PageSuspense>} />

          {/* Learning */}
          <Route path="learning" element={<PageSuspense><CourseCataloguePage /></PageSuspense>} />
          <Route path="learning/plans" element={<PageSuspense><LearningPlanPage /></PageSuspense>} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}
