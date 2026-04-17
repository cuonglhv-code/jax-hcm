import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'

export function useCourses(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['courses', filters],
    queryFn: () => api.get('/learning/courses', { params: filters }).then(r => r.data),
  })
}

export function useCourse(id?: string) {
  return useQuery({
    queryKey: ['courses', id],
    queryFn: () => api.get(`/learning/courses/${id}`).then(r => r.data),
    enabled: !!id,
  })
}

export function useCreateCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/learning/courses', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['courses'] }),
  })
}

export function useUpdateCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Record<string, unknown>) => api.put(`/learning/courses/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['courses'] }),
  })
}

export function useDeleteCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/learning/courses/${id}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['courses'] }),
  })
}

export function useEnrolEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/learning/enrolments', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['enrolments'] }),
  })
}

export function useUpdateEnrolmentStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/learning/enrolments/${id}/status`, { status }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['enrolments'] }),
  })
}

export function useEnrolmentsByEmployee(employeeId?: string, status?: string) {
  return useQuery({
    queryKey: ['enrolments', 'employee', employeeId, status],
    queryFn: () => api.get('/learning/enrolments', { params: { employeeId, status } }).then(r => r.data),
    enabled: !!employeeId,
  })
}

export function useEnrolmentsByCourse(courseId?: string) {
  return useQuery({
    queryKey: ['enrolments', 'course', courseId],
    queryFn: () => api.get(`/learning/courses/${courseId}/enrolments`).then(r => r.data),
    enabled: !!courseId,
  })
}

export function useCertificate(id?: string) {
  return useQuery({
    queryKey: ['certificates', id],
    queryFn: () => api.get(`/learning/certificates/${id}`).then(r => r.data),
    enabled: !!id,
  })
}

export function usePlans(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['plans', params],
    queryFn: () => api.get('/learning/plans', { params }).then(r => r.data),
  })
}

export function usePlan(id?: string) {
  return useQuery({
    queryKey: ['plans', id],
    queryFn: () => api.get(`/learning/plans/${id}`).then(r => r.data),
    enabled: !!id,
  })
}

export function useCreatePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/learning/plans', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plans'] }),
  })
}

export function useUpdatePlanItems() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, items }: { id: string; items: unknown[] }) =>
      api.put(`/learning/plans/${id}/items`, { items }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plans'] }),
  })
}

export function useMandatoryTraining() {
  return useQuery({
    queryKey: ['mandatory-training'],
    queryFn: () => api.get('/learning/mandatory').then(r => r.data),
  })
}

export function useCreateMandatoryTraining() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/learning/mandatory', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mandatory-training'] }),
  })
}

export function useDeleteMandatoryTraining() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/learning/mandatory/${id}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mandatory-training'] }),
  })
}

export function useMandatoryTrainingStatus(employeeId?: string) {
  return useQuery({
    queryKey: ['mandatory-training-status', employeeId],
    queryFn: () => api.get('/learning/mandatory/status', { params: { employeeId } }).then(r => r.data),
    enabled: !!employeeId,
  })
}
