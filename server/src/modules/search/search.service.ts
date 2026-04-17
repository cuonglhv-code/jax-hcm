import db from '../../config/database'
import { AppError } from '../../middleware/errorHandler'

export interface SearchResult {
  type: 'employee' | 'candidate' | 'requisition' | 'course' | 'payroll_run'
  id: string
  title: string
  subtitle: string
  url: string
}

export interface SearchResults {
  employees: SearchResult[]
  candidates: SearchResult[]
  requisitions: SearchResult[]
  courses: SearchResult[]
  payrollRuns: SearchResult[]
}

type Role = 'super_admin' | 'hr_manager' | 'line_manager' | 'employee'

export const searchService = {
  async globalSearch(query: string, _userId: string, role: Role): Promise<SearchResults> {
    if (query.length < 2) throw new AppError(400, 'Query must be at least 2 characters')

    const q = `%${query}%`

    const [employees, candidates, requisitions, courses, payrollRuns] = await Promise.all([
      // Employees — not visible to pure employees
      role !== 'employee'
        ? db('employees')
            .whereNull('employees.deleted_at')
            .where(function () {
              this.whereRaw("(first_name || ' ' || last_name) ILIKE ?", [q])
                .orWhereRaw('employees.email ILIKE ?', [q])
            })
            .leftJoin('job_titles', 'employees.job_title_id', 'job_titles.id')
            .leftJoin('departments', 'employees.department_id', 'departments.id')
            .select('employees.id', 'employees.first_name', 'employees.last_name', 'job_titles.title', 'departments.name as dept_name')
            .limit(5)
            .catch(() => [])
        : Promise.resolve([]),

      // Candidates — hr_manager+
      ['hr_manager', 'super_admin'].includes(role)
        ? db('candidates')
            .whereNull('deleted_at')
            .where(function () {
              this.whereRaw("(first_name || ' ' || last_name) ILIKE ?", [q])
                .orWhereRaw('email ILIKE ?', [q])
            })
            .select('id', 'first_name', 'last_name', 'email', 'stage')
            .limit(5)
            .catch(() => [])
        : Promise.resolve([]),

      // Requisitions — hr_manager+
      ['hr_manager', 'super_admin'].includes(role)
        ? db('job_requisitions')
            .whereNull('deleted_at')
            .whereRaw('title ILIKE ?', [q])
            .leftJoin('departments', 'job_requisitions.department_id', 'departments.id')
            .select('job_requisitions.id', 'job_requisitions.title', 'job_requisitions.status', 'departments.name as dept_name')
            .limit(5)
            .catch(() => [])
        : Promise.resolve([]),

      // Courses — all roles
      db('courses')
        .whereNull('deleted_at')
        .whereRaw('title ILIKE ?', [q])
        .select('id', 'title', 'type', 'duration_hours')
        .limit(5)
        .catch(() => []),

      // Payroll runs — hr_manager+
      ['hr_manager', 'super_admin', 'payroll_manager'].includes(role as string)
        ? db('payroll_runs')
            .whereNull('deleted_at')
            .whereRaw('name ILIKE ?', [q])
            .select('id', 'name', 'status', 'period_start')
            .limit(5)
            .catch(() => [])
        : Promise.resolve([]),
    ])

    return {
      employees: (employees as any[]).map(e => ({
        type: 'employee' as const,
        id: e.id,
        title: `${e.first_name} ${e.last_name}`,
        subtitle: [e.title, e.dept_name].filter(Boolean).join(' · '),
        url: `/employees/${e.id}`,
      })),
      candidates: (candidates as any[]).map(c => ({
        type: 'candidate' as const,
        id: c.id,
        title: `${c.first_name} ${c.last_name}`,
        subtitle: `${c.email} · ${c.stage}`,
        url: `/recruitment/candidates/${c.id}`,
      })),
      requisitions: (requisitions as any[]).map(r => ({
        type: 'requisition' as const,
        id: r.id,
        title: r.title,
        subtitle: [r.dept_name, r.status].filter(Boolean).join(' · '),
        url: `/recruitment?requisitionId=${r.id}`,
      })),
      courses: (courses as any[]).map(c => ({
        type: 'course' as const,
        id: c.id,
        title: c.title,
        subtitle: [c.type, c.duration_hours ? `${c.duration_hours}h` : ''].filter(Boolean).join(' · '),
        url: `/learning/courses/${c.id}`,
      })),
      payrollRuns: (payrollRuns as any[]).map(r => ({
        type: 'payroll_run' as const,
        id: r.id,
        title: r.name,
        subtitle: `${r.status} · ${r.period_start ? new Date(r.period_start).toLocaleDateString('en-GB') : ''}`,
        url: `/payroll/runs/${r.id}`,
      })),
    }
  },
}
