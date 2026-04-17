import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'

export function useLeaveTypes() {
  return useQuery({
    queryKey: ['leave-types'],
    queryFn: () => api.get('/leave/types').then(r => r.data),
  })
}

export function useCreateLeaveType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/leave/types', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leave-types'] }),
  })
}

export function useUpdateLeaveType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Record<string, unknown>) => api.put(`/leave/types/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leave-types'] }),
  })
}

export function useEntitlements(employeeId?: string, year?: number) {
  return useQuery({
    queryKey: ['entitlements', employeeId, year],
    queryFn: () => api.get('/leave/entitlements', { params: { employeeId, year } }).then(r => r.data),
    enabled: !!employeeId,
  })
}

export function useCreateEntitlement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/leave/entitlements', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['entitlements'] }),
  })
}

export function useLeaveBalance(employeeId?: string, year?: number) {
  return useQuery({
    queryKey: ['leave-balance', employeeId, year],
    queryFn: () => api.get('/leave/balance', { params: { employeeId, year } }).then(r => r.data),
    enabled: !!employeeId,
  })
}

export function useLeaveRequests(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['leave-requests', filters],
    queryFn: () => api.get('/leave/requests', { params: filters }).then(r => r.data),
  })
}

export function useLeaveRequest(id?: string) {
  return useQuery({
    queryKey: ['leave-requests', id],
    queryFn: () => api.get(`/leave/requests/${id}`).then(r => r.data),
    enabled: !!id,
  })
}

export function useCreateLeaveRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/leave/requests', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leave-requests'] })
      qc.invalidateQueries({ queryKey: ['leave-balance'] })
    },
  })
}

export function useReviewLeaveRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, action, notes }: { id: string; action: string; notes?: string }) =>
      api.put(`/leave/requests/${id}/review`, { action, notes }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leave-requests'] }),
  })
}

export function useCancelLeaveRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/leave/requests/${id}/cancel`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leave-requests'] }),
  })
}

export function useTeamCalendar(managerId?: string, month?: number, year?: number) {
  return useQuery({
    queryKey: ['team-calendar', managerId, month, year],
    queryFn: () => api.get('/leave/calendar', { params: { managerId, month, year } }).then(r => r.data),
    enabled: !!managerId,
  })
}

export function usePublicHolidays(region?: string, year?: number) {
  return useQuery({
    queryKey: ['public-holidays', region, year],
    queryFn: () => api.get('/leave/public-holidays', { params: { region, year } }).then(r => r.data),
  })
}

export function useCreatePublicHoliday() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/leave/public-holidays', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['public-holidays'] }),
  })
}

export function useDeletePublicHoliday() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/leave/public-holidays/${id}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['public-holidays'] }),
  })
}

export function useClockIn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data?: Record<string, unknown>) => api.post('/leave/attendance/clock-in', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attendance'] }),
  })
}

export function useClockOut() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data?: Record<string, unknown>) => api.post('/leave/attendance/clock-out', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attendance'] }),
  })
}

export function useAttendance(employeeId?: string, filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['attendance', employeeId, filters],
    queryFn: () => api.get('/leave/attendance', { params: { employeeId, ...filters } }).then(r => r.data),
    enabled: !!employeeId,
  })
}

export function useExportAttendance() {
  return useMutation({
    mutationFn: (params: Record<string, unknown>) =>
      api.get('/leave/attendance/export', { params, responseType: 'blob' }).then(r => r.data),
  })
}
