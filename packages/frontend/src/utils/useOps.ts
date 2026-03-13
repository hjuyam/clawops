import { useQuery, useMutation } from '@tanstack/react-query'
import api from '../utils/api'

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy'
  checks: {
    connectivity: { status: 'pass' | 'fail'; details: string }
    capabilities: { status: 'pass' | 'fail'; details: string }
    authorization: { status: 'pass' | 'fail'; details: string }
    resources: { status: 'pass' | 'fail'; details: string }
  }
  timestamp: string
  duration: number
}

export interface GatewayStatus {
  connected: boolean
  version?: string
  uptime?: number
  lastChecked: string
  error?: string
}

export interface DiagnosticsBundle {
  generated_at: string
  system_info: {
    platform: string
    node_version: string
    memory_usage: NodeJS.MemoryUsage
    uptime: number
  }
  gateway_status: GatewayStatus
  recent_errors: Array<{
    timestamp: string
    error: string
  }>
  recommendations: string[]
}

export function useGatewayStatus() {
  return useQuery({
    queryKey: ['ops', 'gateway-status'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: GatewayStatus }>('/ops/gateway_status')
      return response.data
    },
    refetchInterval: 30000,
  })
}

export function useSelfCheck() {
  return useMutation({
    mutationFn: async () => {
      const response = await api.post<{ success: boolean; data: HealthCheckResult }>('/ops/self_check')
      return response.data
    },
  })
}

export function useRestartGateway() {
  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/ops/restart_gateway')
      return response.data
    },
  })
}

export function useCleanup() {
  return useMutation({
    mutationFn: async (dryRun: boolean = true) => {
      const response = await api.post('/ops/cleanup', { dry_run: dryRun })
      return response.data
    },
  })
}

export function useDiagnostics() {
  return useMutation({
    mutationFn: async () => {
      const response = await api.get<{ success: boolean; data: DiagnosticsBundle }>('/ops/diagnostics_bundle')
      return response.data
    },
  })
}

export function useBackupAll() {
  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/ops/backup_all')
      return response.data
    },
  })
}
