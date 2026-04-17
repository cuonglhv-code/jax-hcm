import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import AppLayout from '../layouts/AppLayout';
import ProtectedRoute from './ProtectedRoute';
import RoleGuard from './RoleGuard';

import LoginPage from '../pages/LoginPage';
import Page403 from '../pages/Page403';
import Page404 from '../pages/Page404';

// Lazy loading the stubs
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'));

const EmployeeListPage = lazy(() => import('../pages/employees/EmployeeListPage'));
const OrgChartPage = lazy(() => import('../pages/employees/OrgChartPage'));
const EmployeeFormPage = lazy(() => import('../pages/employees/EmployeeFormPage'));
const EmployeeProfilePage = lazy(() => import('../pages/employees/EmployeeProfilePage'));

const DepartmentListPage = lazy(() => import('../pages/departments/DepartmentListPage'));

const PayrollDashboardPage = lazy(() => import('../pages/payroll/PayrollDashboardPage'));
const PayrollRunsPage = lazy(() => import('../pages/payroll/PayrollRunsPage'));
const PayrollRunDetailPage = lazy(() => import('../pages/payroll/PayrollRunDetailPage'));
const TaxRulesPage = lazy(() => import('../pages/payroll/TaxRulesPage'));

const RequisitionsPage = lazy(() => import('../pages/recruitment/RequisitionsPage'));
const CandidatePipelinePage = lazy(() => import('../pages/recruitment/CandidatePipelinePage'));
const CandidateDetailPage = lazy(() => import('../pages/recruitment/CandidateDetailPage'));
const OnboardingPage = lazy(() => import('../pages/recruitment/OnboardingPage'));

const AppraisalCyclesPage = lazy(() => import('../pages/performance/AppraisalCyclesPage'));
const GoalsPage = lazy(() => import('../pages/performance/GoalsPage'));
const PerformanceDashboardPage = lazy(() => import('../pages/performance/PerformanceDashboardPage'));

const LeaveRequestPage = lazy(() => import('../pages/leave/LeaveRequestPage'));
const LeaveCalendarPage = lazy(() => import('../pages/leave/LeaveCalendarPage'));
const LeaveAdminPage = lazy(() => import('../pages/leave/LeaveAdminPage'));
const AttendancePage = lazy(() => import('../pages/leave/AttendancePage'));

const CourseCataloguePage = lazy(() => import('../pages/learning/CourseCataloguePage'));
const CourseDetailPage = lazy(() => import('../pages/learning/CourseDetailPage'));
const MyLearningPage = lazy(() => import('../pages/learning/MyLearningPage'));
const LearningPlanPage = lazy(() => import('../pages/learning/LearningPlanPage'));
const MandatoryTrainingPage = lazy(() => import('../pages/learning/MandatoryTrainingPage'));

const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={
    <div className="flex h-full items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary rounded-full border-t-transparent animate-spin"></div>
    </div>
  }>
    {children}
  </Suspense>
);

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: 'dashboard',
            element: <SuspenseWrapper><DashboardPage /></SuspenseWrapper>
          },
          // Employees
          {
            path: 'employees',
            element: <RoleGuard allowedRoles={['employee', 'line_manager', 'hr_manager', 'payroll_manager', 'super_admin']} />,
            children: [
              { index: true, element: <SuspenseWrapper><EmployeeListPage /></SuspenseWrapper> },
              { path: 'org', element: <SuspenseWrapper><OrgChartPage /></SuspenseWrapper> },
              { path: 'new', element: <SuspenseWrapper><EmployeeFormPage /></SuspenseWrapper> },
              { path: ':id', element: <SuspenseWrapper><EmployeeProfilePage /></SuspenseWrapper> },
              { path: ':id/edit', element: <SuspenseWrapper><EmployeeFormPage /></SuspenseWrapper> }
            ]
          },
          // Departments
          {
            path: 'departments',
            element: <RoleGuard allowedRoles={['hr_manager']} />,
            children: [
              { index: true, element: <SuspenseWrapper><DepartmentListPage /></SuspenseWrapper> }
            ]
          },
          // Payroll
          {
            path: 'payroll',
            element: <RoleGuard allowedRoles={['hr_manager']} />,
            children: [
              { index: true, element: <SuspenseWrapper><PayrollDashboardPage /></SuspenseWrapper> },
              { path: 'runs', element: <SuspenseWrapper><PayrollRunsPage /></SuspenseWrapper> },
              { path: 'runs/:id', element: <SuspenseWrapper><PayrollRunDetailPage /></SuspenseWrapper> },
              { path: 'tax-rules', element: <SuspenseWrapper><TaxRulesPage /></SuspenseWrapper> }
            ]
          },
          // Recruitment
          {
            path: 'recruitment',
            element: <RoleGuard allowedRoles={['hr_manager']} />,
            children: [
              { index: true, element: <SuspenseWrapper><RequisitionsPage /></SuspenseWrapper> },
              { path: 'pipeline', element: <SuspenseWrapper><CandidatePipelinePage /></SuspenseWrapper> },
              { path: 'candidates/:id', element: <SuspenseWrapper><CandidateDetailPage /></SuspenseWrapper> },
              { path: 'onboarding', element: <SuspenseWrapper><OnboardingPage /></SuspenseWrapper> }
            ]
          },
          // Performance
          {
            path: 'performance',
            element: <RoleGuard allowedRoles={['employee', 'line_manager', 'hr_manager', 'payroll_manager', 'super_admin']} />,
            children: [
              { index: true, element: <SuspenseWrapper><AppraisalCyclesPage /></SuspenseWrapper> },
              { path: 'goals', element: <SuspenseWrapper><GoalsPage /></SuspenseWrapper> },
              { path: 'dashboard', element: <SuspenseWrapper><PerformanceDashboardPage /></SuspenseWrapper> }
            ]
          },
          // Leave
          {
            path: 'leave',
            element: <RoleGuard allowedRoles={['employee', 'line_manager', 'hr_manager', 'payroll_manager', 'super_admin']} />,
            children: [
              { index: true, element: <SuspenseWrapper><LeaveRequestPage /></SuspenseWrapper> },
              { path: 'calendar', element: <SuspenseWrapper><LeaveCalendarPage /></SuspenseWrapper> },
              { path: 'admin', element: <RoleGuard allowedRoles={['line_manager', 'hr_manager']}><SuspenseWrapper><LeaveAdminPage /></SuspenseWrapper></RoleGuard> },
              { path: 'attendance', element: <SuspenseWrapper><AttendancePage /></SuspenseWrapper> }
            ]
          },
          // Learning
          {
            path: 'learning',
            element: <RoleGuard allowedRoles={['employee', 'line_manager', 'hr_manager', 'payroll_manager', 'super_admin']} />,
            children: [
              { index: true, element: <SuspenseWrapper><CourseCataloguePage /></SuspenseWrapper> },
              { path: 'courses/:id', element: <SuspenseWrapper><CourseDetailPage /></SuspenseWrapper> },
              { path: 'my', element: <SuspenseWrapper><MyLearningPage /></SuspenseWrapper> },
              { path: 'plans', element: <RoleGuard allowedRoles={['hr_manager']}><SuspenseWrapper><LearningPlanPage /></SuspenseWrapper></RoleGuard> },
              { path: 'mandatory', element: <SuspenseWrapper><MandatoryTrainingPage /></SuspenseWrapper> }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '*',
    element: <Page404 />,
  }
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
