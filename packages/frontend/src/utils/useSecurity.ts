import { useQuery, useMutation } from '@tanstack/react-query'
import api from '../utils/api'

export interface AuditLog {
  id: number
  event_id: string
  event_time: string
  actor_type: string | null
  actor_id: string | null
  actor_ip: string | null
  action: string
  resource_type: string | null
  resource_id: string | null
  status: string | null
  reason: string | null
  risk_level: string
}

export interface SecurityScore {
  score: number
  status: 'good' | 'warning' | 'danger'
  checks: Record<string, boolean>
}

export function useAuditLogs(params?: { action?: string; actor_id?: string; limit?: number }) {
  return useQuery({
    queryKey: ['audit-logs', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams()
      if (params?.action) queryParams.append('action', params.action)
      if (params?.actor_id) queryParams.append('actor_id', params.actor_id)
      if (params?.limit) queryParams.append('limit', String(params.limit))
      
      const response = await api.get<{ success: boolean; data: AuditLog[] }>(`/security/logs?${queryParams}`)
      return response.data
    },
  })
}

export function useSecurityScore() {
  return useQuery({
    queryKey: ['security', 'score'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: SecurityScore }>('/security/score')
      return response.data
    },
  })
}

export function useSessions() {
  return useQuery({
    queryKey: ['security', 'sessions'],
    queryFn: async () => {
      const response = await api.get('/security/sessions')
      return response.data
    },
  })
}

export function useTerminateSession() {
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await api.delete(`/security/sessions/${sessionId}`)
      return response.data
    },
  })
}

export function useExportAuditLogs() {
  return useMutation({
    mutationFn: async () => {
      const response = await api.get('/security/export')
      return response.data
    },
  })
}
