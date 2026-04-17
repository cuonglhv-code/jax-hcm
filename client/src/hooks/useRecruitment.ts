import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'

export function useRequisitions(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['requisitions', params],
    queryFn: () => api.get('/recruitment/requisitions', { params }).then(r => r.data),
  })
}

export function useRequisition(id?: string) {
  return useQuery({
    queryKey: ['requisitions', id],
    queryFn: () => api.get(`/recruitment/requisitions/${id}`).then(r => r.data),
    enabled: !!id,
  })
}

export function useCreateRequisition() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/recruitment/requisitions', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['requisitions'] }),
  })
}

export function useUpdateRequisition() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Record<string, unknown>) => api.put(`/recruitment/requisitions/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['requisitions'] }),
  })
}

export function useCloseRequisition() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/recruitment/requisitions/${id}/close`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['requisitions'] }),
  })
}

export function useCandidates(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['candidates', params],
    queryFn: () => api.get('/recruitment/candidates', { params }).then(r => r.data),
  })
}

export function useCandidate(id?: string) {
  return useQuery({
    queryKey: ['candidates', id],
    queryFn: () => api.get(`/recruitment/candidates/${id}`).then(r => r.data),
    enabled: !!id,
  })
}

export function useCreateCandidate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/recruitment/candidates', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['candidates'] }),
  })
}

export function useUpdateCandidate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Record<string, unknown>) => api.put(`/recruitment/candidates/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['candidates'] }),
  })
}

export function useCreateApplication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/recruitment/applications', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications'] }),
  })
}

export function useApplicationsByRequisition(requisitionId?: string) {
  return useQuery({
    queryKey: ['applications', 'requisition', requisitionId],
    queryFn: () => api.get(`/recruitment/requisitions/${requisitionId}/applications`).then(r => r.data),
    enabled: !!requisitionId,
  })
}

export function useApplicationsByCandidate(candidateId?: string) {
  return useQuery({
    queryKey: ['applications', 'candidate', candidateId],
    queryFn: () => api.get(`/recruitment/candidates/${candidateId}/applications`).then(r => r.data),
    enabled: !!candidateId,
  })
}

export function useAdvanceStage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ applicationId, stage }: { applicationId: string; stage: string }) =>
      api.put(`/recruitment/applications/${applicationId}/stage`, { stage }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications'] }),
  })
}

export function useConvertToEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ applicationId, ...data }: Record<string, unknown>) =>
      api.post(`/recruitment/applications/${applicationId}/convert`, data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['applications'] }); qc.invalidateQueries({ queryKey: ['employees'] }) },
  })
}

export function useInterviews(applicationId?: string) {
  return useQuery({
    queryKey: ['interviews', applicationId],
    queryFn: () => api.get(`/recruitment/applications/${applicationId}/interviews`).then(r => r.data),
    enabled: !!applicationId,
  })
}

export function useCreateInterview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ applicationId, ...data }: Record<string, unknown>) =>
      api.post(`/recruitment/applications/${applicationId}/interviews`, data).then(r => r.data),
    onSuccess: (_d, { applicationId }) => qc.invalidateQueries({ queryKey: ['interviews', applicationId as string] }),
  })
}

export function useUpdateInterview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Record<string, unknown>) =>
      api.put(`/recruitment/interviews/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['interviews'] }),
  })
}

export function useCreateOffer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ applicationId, ...data }: Record<string, unknown>) =>
      api.post(`/recruitment/applications/${applicationId}/offers`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications'] }),
  })
}

export function useUpdateOfferStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/recruitment/offers/${id}/status`, { status }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications'] }),
  })
}

export function useOnboardingChecklist(employeeId?: string) {
  return useQuery({
    queryKey: ['onboarding', employeeId],
    queryFn: () => api.get(`/recruitment/onboarding/${employeeId}`).then(r => r.data),
    enabled: !!employeeId,
  })
}

export function useUpdateTaskCompletion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, completed }: { taskId: string; completed: boolean }) =>
      api.put(`/recruitment/onboarding/tasks/${taskId}`, { completed }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['onboarding'] }),
  })
}
