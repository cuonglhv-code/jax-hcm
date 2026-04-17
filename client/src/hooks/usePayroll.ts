import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'

export function useSalary(employeeId?: string) {
  return useQuery({
    queryKey: ['salary', employeeId],
    queryFn: () => api.get(`/payroll/salary/${employeeId}`).then(r => r.data),
    enabled: !!employeeId,
  })
}

export function useSalaryHistory(employeeId?: string) {
  return useQuery({
    queryKey: ['salary-history', employeeId],
    queryFn: () => api.get(`/payroll/salary/${employeeId}/history`).then(r => r.data),
    enabled: !!employeeId,
  })
}

export function useCreateSalary() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/payroll/salary', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['salary'] }),
  })
}

export function useAllowances(employeeId?: string) {
  return useQuery({
    queryKey: ['allowances', employeeId],
    queryFn: () => api.get('/payroll/allowances', { params: { employeeId } }).then(r => r.data),
  })
}

export function useCreateAllowance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/payroll/allowances', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['allowances'] }),
  })
}

export function useDeleteAllowance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/payroll/allowances/${id}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['allowances'] }),
  })
}

export function useDeductions(employeeId?: string) {
  return useQuery({
    queryKey: ['deductions', employeeId],
    queryFn: () => api.get('/payroll/deductions', { params: { employeeId } }).then(r => r.data),
  })
}

export function useCreateDeduction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/payroll/deductions', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deductions'] }),
  })
}

export function useDeleteDeduction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/payroll/deductions/${id}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deductions'] }),
  })
}

export function useTaxRules() {
  return useQuery({
    queryKey: ['tax-rules'],
    queryFn: () => api.get('/payroll/tax-rules').then(r => r.data),
  })
}

export function useCreateTaxRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/payroll/tax-rules', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tax-rules'] }),
  })
}

export function useUpdateTaxRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Record<string, unknown>) => api.put(`/payroll/tax-rules/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tax-rules'] }),
  })
}

export function useDeleteTaxRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/payroll/tax-rules/${id}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tax-rules'] }),
  })
}

export function usePayrollRuns(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['payroll-runs', params],
    queryFn: () => api.get('/payroll/runs', { params }).then(r => r.data),
  })
}

export function usePayrollRun(id?: string) {
  return useQuery({
    queryKey: ['payroll-runs', id],
    queryFn: () => api.get(`/payroll/runs/${id}`).then(r => r.data),
    enabled: !!id,
  })
}

export function useCreatePayrollRun() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/payroll/runs', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payroll-runs'] }),
  })
}

export function useAdvancePayrollRun() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/payroll/runs/${id}/advance`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payroll-runs'] }),
  })
}

export function useRunPayslips(runId?: string, params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['payslips', 'run', runId, params],
    queryFn: () => api.get(`/payroll/runs/${runId}/payslips`, { params }).then(r => r.data),
    enabled: !!runId,
  })
}

export function usePayslip(id?: string) {
  return useQuery({
    queryKey: ['payslips', id],
    queryFn: () => api.get(`/payroll/payslips/${id}`).then(r => r.data),
    enabled: !!id,
  })
}

export function useEmployeePayslips(employeeId?: string, params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['payslips', 'employee', employeeId, params],
    queryFn: () => api.get(`/payroll/employees/${employeeId}/payslips`, { params }).then(r => r.data),
    enabled: !!employeeId,
  })
}
