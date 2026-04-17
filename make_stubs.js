const fs = require('fs');
const path = require('path');
const dirs = [
  'dashboard', 'employees', 'departments', 'payroll', 'recruitment', 'performance', 'leave', 'learning'
];
dirs.forEach(d => fs.mkdirSync(path.join('client/src/pages', d), { recursive: true }));

const stubs = {
  'dashboard/DashboardPage.tsx': 'DashboardPage',
  'employees/EmployeeListPage.tsx': 'EmployeeListPage',
  'employees/OrgChartPage.tsx': 'OrgChartPage',
  'employees/EmployeeFormPage.tsx': 'EmployeeFormPage',
  'employees/EmployeeProfilePage.tsx': 'EmployeeProfilePage',
  'departments/DepartmentListPage.tsx': 'DepartmentListPage',
  'payroll/PayrollDashboardPage.tsx': 'PayrollDashboardPage',
  'payroll/PayrollRunsPage.tsx': 'PayrollRunsPage',
  'payroll/PayrollRunDetailPage.tsx': 'PayrollRunDetailPage',
  'payroll/TaxRulesPage.tsx': 'TaxRulesPage',
  'recruitment/RequisitionsPage.tsx': 'RequisitionsPage',
  'recruitment/CandidatePipelinePage.tsx': 'CandidatePipelinePage',
  'recruitment/CandidateDetailPage.tsx': 'CandidateDetailPage',
  'recruitment/OnboardingPage.tsx': 'OnboardingPage',
  'performance/AppraisalCyclesPage.tsx': 'AppraisalCyclesPage',
  'performance/GoalsPage.tsx': 'GoalsPage',
  'performance/PerformanceDashboardPage.tsx': 'PerformanceDashboardPage',
  'leave/LeaveRequestPage.tsx': 'LeaveRequestPage',
  'leave/LeaveCalendarPage.tsx': 'LeaveCalendarPage',
  'leave/LeaveAdminPage.tsx': 'LeaveAdminPage',
  'leave/AttendancePage.tsx': 'AttendancePage',
  'learning/CourseCataloguePage.tsx': 'CourseCataloguePage',
  'learning/CourseDetailPage.tsx': 'CourseDetailPage',
  'learning/MyLearningPage.tsx': 'MyLearningPage',
  'learning/LearningPlanPage.tsx': 'LearningPlanPage',
  'learning/MandatoryTrainingPage.tsx': 'MandatoryTrainingPage',
};

for (const [file, name] of Object.entries(stubs)) {
  fs.writeFileSync(path.join('client/src/pages', file), 
    `import React from 'react';\n\nexport default function ${name}() {\n  return (\n    <div className="card">\n      <h1 className="font-display text-xl font-bold">${name.replace('Page','')}</h1>\n      <p className="text-text-muted mt-1">Coming in Phase 6.</p>\n    </div>\n  );\n}\n`
  );
}
