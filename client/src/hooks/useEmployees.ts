import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'

export function useEmployees(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['employees', params],
    queryFn: () => api.get('/employees', { params }).then(r => r.data),
  })
}

export function useEmployee(id?: string) {
  return useQuery({
    queryKey: ['employees', id],
    queryFn: () => api.get(`/employees/${id}`).then(r => r.data),
    enabled: !!id,
  })
}

export function useCreateEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/employees', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  })
}

export function useUpdateEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Record<string, unknown>) => api.put(`/employees/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  })
}

export function useDeleteEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/employees/${id}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  })
}

export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: () => api.get('/employees/departments').then(r => r.data),
  })
}

export function useCreateDepartment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/employees/departments', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['departments'] }),
  })
}

export function useUpdateDepartment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Record<string, unknown>) => api.put(`/employees/departments/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['departments'] }),
  })
}

export function useDeleteDepartment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/employees/departments/${id}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['departments'] }),
  })
}

export function useJobTitles(departmentId?: string) {
  return useQuery({
    queryKey: ['job-titles', departmentId],
    queryFn: () => api.get('/employees/job-titles', { params: { departmentId } }).then(r => r.data),
  })
}

export function useOrgTree() {
  return useQuery({
    queryKey: ['org-tree'],
    queryFn: () => api.get('/employees/org-chart').then(r => r.data),
  })
}

export function useEmployeeDocuments(id?: string) {
  return useQuery({
    queryKey: ['employee-documents', id],
    queryFn: () => api.get(`/employees/${id}/documents`).then(r => r.data),
    enabled: !!id,
  })
}

export function useUploadDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      api.post(`/employees/${id}/documents`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
    onSuccess: (_d, { id }) => qc.invalidateQueries({ queryKey: ['employee-documents', id] }),
  })
}

export function useDeleteDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, docId }: { id: string; docId: string }) =>
      api.delete(`/employees/${id}/documents/${docId}`).then(r => r.data),
    onSuccess: (_d, { id }) => qc.invalidateQueries({ queryKey: ['employee-documents', id] }),
  })
}

export function useAuditLog(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['audit-log', filters],
    queryFn: () => api.get('/employees/audit-log', { params: filters }).then(r => r.data),
  })
}
