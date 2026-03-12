export interface CapabilitiesResponse {
  gateway_version: string
  deployment: 'local' | 'proxy' | 'remote'
  auth_support: string[]
  supports_sse: boolean
  supports_browser: boolean
  supports_nodes: boolean
  supports_memory: boolean
  supports_config_edit: boolean
  supported_channels: string[]
}

export type RunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'stopped'

export interface Run {
  id: string
  task_id?: string
  workflow_id?: string
  status: RunStatus
  created_at: string
  updated_at: string
  parameters?: Record<string, unknown>
}

export interface CreateRunRequest {
  task_id?: string
  workflow_id?: string
  parameters?: Record<string, unknown>
}

export interface SelfCheckResult {
  timestamp: string
  checks: {
    connectivity: { status: string; details: string }
    capabilities: { status: string; details: string }
    authorization: { status: string; details: string }
    resources: { status: string; details: string }
  }
  overall_status: 'healthy' | 'degraded' | 'unhealthy'
}

export interface ConfigVersion {
  version: string
  hash: string
  created_at: string
}

export interface ConfigChange {
  path: string
  old_value: string
  new_value: string
}

export interface Memory {
  id: string
  title: string
  content: string
  source: 'conversation' | 'task' | 'web' | 'file'
  created_at: string
  pinned: boolean
}

export interface AuditLog {
  event_id: string
  event_time: string
  actor_type: string
  actor_id: string
  actor_ip: string
  action: string
  resource_type: string
  resource_id: string
  status: 'success' | 'failure'
  details?: Record<string, unknown>
}

export interface SecurityScore {
  score: number
  status: 'good' | 'warning' | 'danger'
  checks: Record<string, boolean>
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}
