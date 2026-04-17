import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'

export function useCycles(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['cycles', params],
    queryFn: () => api.get('/performance/cycles', { params }).then(r => r.data),
  })
}

export function useCycle(id?: string) {
  return useQuery({
    queryKey: ['cycles', id],
    queryFn: () => api.get(`/performance/cycles/${id}`).then(r => r.data),
    enabled: !!id,
  })
}

export function useCreateCycle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/performance/cycles', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cycles'] }),
  })
}

export function useActivateCycle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/performance/cycles/${id}/activate`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cycles'] }),
  })
}

export function useAppraisals(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['appraisals', filters],
    queryFn: () => api.get('/performance/appraisals', { params: filters }).then(r => r.data),
  })
}

export function useAppraisal(id?: string) {
  return useQuery({
    queryKey: ['appraisals', id],
    queryFn: () => api.get(`/performance/appraisals/${id}`).then(r => r.data),
    enabled: !!id,
  })
}

export function useCreateAppraisal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/performance/appraisals', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appraisals'] }),
  })
}

export function useAdvanceAppraisal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      api.post(`/performance/appraisals/${id}/advance`, { action }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appraisals'] }),
  })
}

export function useSaveResponses() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, responses }: { id: string; responses: Record<string, unknown> }) =>
      api.put(`/performance/appraisals/${id}/responses`, responses).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appraisals'] }),
  })
}

export function useGoals(employeeId?: string, cycleId?: string) {
  return useQuery({
    queryKey: ['goals', employeeId, cycleId],
    queryFn: () => api.get('/performance/goals', { params: { employeeId, cycleId } }).then(r => r.data),
  })
}

export function useGoal(id?: string) {
  return useQuery({
    queryKey: ['goals', id],
    queryFn: () => api.get(`/performance/goals/${id}`).then(r => r.data),
    enabled: !!id,
  })
}

export function useCreateGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/performance/goals', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  })
}

export function useUpdateGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Record<string, unknown>) => api.put(`/performance/goals/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  })
}

export function useDeleteGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/performance/goals/${id}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  })
}

export function useCreateKeyResult() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ goalId, ...data }: Record<string, unknown>) =>
      api.post(`/performance/goals/${goalId}/key-results`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  })
}

export function useUpdateKeyResult() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Record<string, unknown>) =>
      api.put(`/performance/key-results/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  })
}

export function useDeleteKeyResult() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/performance/key-results/${id}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  })
}

export function usePerformanceDashboard(cycleId?: string) {
  return useQuery({
    queryKey: ['performance-dashboard', cycleId],
    queryFn: () => api.get('/performance/dashboard', { params: { cycleId } }).then(r => r.data),
    enabled: !!cycleId,
  })
}
