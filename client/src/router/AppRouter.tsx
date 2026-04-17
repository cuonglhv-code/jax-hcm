import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';

import AppLayout from '../layouts/AppLayout';
import ProtectedRoute from './ProtectedRoute';
import RoleGuard from './RoleGuard';

import LoginPage from '../pages/LoginPage';
import Page403 from '../pages/Page403';
import Page404 from '../pages/Page404';

const Spin = () => (
  <div className="flex h-full items-center justify-center py-12">
    <div className="w-8 h-8 border-2 border-primary rounded-full border-t-transparent animate-spin" />
  </div>
);
const S = ({ children }: { children: React.ReactNode }) => <Suspense fallback={<Spin />}>{children}</Suspense>;

// Dashboard
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'));

// Employees
const EmployeeListPage = lazy(() => import('../pages/employees/EmployeeListPage'));
const OrgChartPage = lazy(() => import('../pages/employees/OrgChartPage'));
const EmployeeFormPage = lazy(() => import('../pages/employees/EmployeeFormPage'));
const EmployeeProfilePage = lazy(() => import('../pages/employees/EmployeeProfilePage'));
const DepartmentListPage = lazy(() => import('../pages/employees/DepartmentListPage'));

// Payroll
const PayrollDashboardPage = lazy(() => import('../pages/payroll/PayrollDashboardPage'));
const PayrollRunsPage = lazy(() => import('../pages/payroll/PayrollRunsPage'));
const PayrollRunDetailPage = lazy(() => import('../pages/payroll/PayrollRunDetailPage'));
const TaxRulesPage = lazy(() => import('../pages/payroll/TaxRulesPage'));
const PayslipPage = lazy(() => import('../pages/payroll/PayslipPage'));

// Recruitment
const RequisitionsPage = lazy(() => import('../pages/recruitment/RequisitionsPage'));
const CandidatePipelinePage = lazy(() => import('../pages/recruitment/CandidatePipelinePage'));
const CandidateDetailPage = lazy(() => import('../pages/recruitment/CandidateDetailPage'));
const OnboardingPage = lazy(() => import('../pages/recruitment/OnboardingPage'));

// Performance
const AppraisalCyclesPage = lazy(() => import('../pages/performance/AppraisalCyclesPage'));
const GoalsPage = lazy(() => import('../pages/performance/GoalsPage'));
const PerformanceDashboardPage = lazy(() => import('../pages/performance/PerformanceDashboardPage'));

// Leave
const LeaveRequestPage = lazy(() => import('../pages/leave/LeaveRequestPage'));
const LeaveCalendarPage = lazy(() => import('../pages/leave/LeaveCalendarPage'));
const LeaveAdminPage = lazy(() => import('../pages/leave/LeaveAdminPage'));
const AttendancePage = lazy(() => import('../pages/leave/AttendancePage'));

// Learning
const CourseCataloguePage = lazy(() => import('../pages/learning/CourseCataloguePage'));
const CourseDetailPage = lazy(() => import('../pages/learning/CourseDetailPage'));
const MyLearningPage = lazy(() => import('../pages/learning/MyLearningPage'));
const LearningPlanPage = lazy(() => import('../pages/learning/LearningPlanPage'));
const MandatoryTrainingPage = lazy(() => import('../pages/learning/MandatoryTrainingPage'));

const HR_ABOVE = ['hr_manager', 'super_admin'];
const ALL_ROLES = ['employee', 'line_manager', 'hr_manager', 'payroll_manager', 'super_admin'];
const MANAGER_ABOVE = ['line_manager', 'hr_manager', 'super_admin'];

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: 'dashboard', element: <S><DashboardPage /></S> },

          // Employees
          {
            path: 'employees',
            element: <RoleGuard allowedRoles={ALL_ROLES} />,
            children: [
              { index: true, element: <S><EmployeeListPage /></S> },
              { path: 'org', element: <S><OrgChartPage /></S> },
              { path: 'new', element: <RoleGuard allowedRoles={HR_ABOVE}><S><EmployeeFormPage /></S></RoleGuard> },
              { path: ':id', element: <S><EmployeeProfilePage /></S> },
              { path: ':id/edit', element: <RoleGuard allowedRoles={HR_ABOVE}><S><EmployeeFormPage /></S></RoleGuard> },
            ],
          },
          // Departments
          {
            path: 'departments',
            element: <RoleGuard allowedRoles={HR_ABOVE} />,
            children: [{ index: true, element: <S><DepartmentListPage /></S> }],
          },
          // Payroll
          {
            path: 'payroll',
            element: <RoleGuard allowedRoles={['hr_manager', 'payroll_manager', 'super_admin']} />,
            children: [
              { index: true, element: <S><PayrollDashboardPage /></S> },
              { path: 'runs', element: <S><PayrollRunsPage /></S> },
              { path: 'runs/:id', element: <S><PayrollRunDetailPage /></S> },
              { path: 'tax-rules', element: <S><TaxRulesPage /></S> },
              { path: 'payslips/:id', element: <S><PayslipPage /></S> },
            ],
          },
          // Recruitment
          {
            path: 'recruitment',
            element: <RoleGuard allowedRoles={HR_ABOVE} />,
            children: [
              { index: true, element: <S><RequisitionsPage /></S> },
              { path: 'pipeline', element: <S><CandidatePipelinePage /></S> },
              { path: 'candidates/:id', element: <S><CandidateDetailPage /></S> },
              { path: 'onboarding', element: <S><OnboardingPage /></S> },
            ],
          },
          // Performance
          {
            path: 'performance',
            element: <RoleGuard allowedRoles={ALL_ROLES} />,
            children: [
              { index: true, element: <S><AppraisalCyclesPage /></S> },
              { path: 'goals', element: <S><GoalsPage /></S> },
              { path: 'dashboard', element: <S><PerformanceDashboardPage /></S> },
            ],
          },
          // Leave
          {
            path: 'leave',
            element: <RoleGuard allowedRoles={ALL_ROLES} />,
            children: [
              { index: true, element: <S><LeaveRequestPage /></S> },
              { path: 'calendar', element: <S><LeaveCalendarPage /></S> },
              { path: 'admin', element: <RoleGuard allowedRoles={MANAGER_ABOVE}><S><LeaveAdminPage /></S></RoleGuard> },
              { path: 'attendance', element: <S><AttendancePage /></S> },
            ],
          },
          // Learning
          {
            path: 'learning',
            element: <RoleGuard allowedRoles={ALL_ROLES} />,
            children: [
              { index: true, element: <S><CourseCataloguePage /></S> },
              { path: 'courses/:id', element: <S><CourseDetailPage /></S> },
              { path: 'my', element: <S><MyLearningPage /></S> },
              { path: 'plans', element: <RoleGuard allowedRoles={HR_ABOVE}><S><LearningPlanPage /></S></RoleGuard> },
              { path: 'mandatory', element: <S><MandatoryTrainingPage /></S> },
            ],
          },

          { path: '403', element: <Page403 /> },
        ],
      },
    ],
  },
  { path: '*', element: <Page404 /> },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
