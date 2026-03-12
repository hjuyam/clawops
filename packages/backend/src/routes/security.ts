import { Router } from 'express'

const router = Router()

interface AuditLog {
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

const auditLogs: AuditLog[] = [
  {
    event_id: 'evt_001',
    event_time: new Date(Date.now() - 600000).toISOString(),
    actor_type: 'user',
    actor_id: 'admin',
    actor_ip: '127.0.0.1',
    action: 'config_change',
    resource_type: 'config',
    resource_id: 'model.yaml',
    status: 'success',
  },
  {
    event_id: 'evt_002',
    event_time: new Date(Date.now() - 3600000).toISOString(),
    actor_type: 'user',
    actor_id: 'admin',
    actor_ip: '127.0.0.1',
    action: 'login',
    resource_type: 'session',
    resource_id: 'sess_001',
    status: 'success',
  },
]

router.get('/logs', (req, res) => {
  const { action, actor, status, from, to } = req.query
  
  let filtered = [...auditLogs]
  
  if (action) {
    filtered = filtered.filter(l => l.action === action)
  }
  
  if (actor) {
    filtered = filtered.filter(l => l.actor_id === actor)
  }
  
  if (status) {
    filtered = filtered.filter(l => l.status === status)
  }
  
  if (from) {
    filtered = filtered.filter(l => new Date(l.event_time) >= new Date(String(from)))
  }
  
  if (to) {
    filtered = filtered.filter(l => new Date(l.event_time) <= new Date(String(to)))
  }
  
  res.json({ success: true, data: filtered })
})

router.post('/logs', (req, res) => {
  const log: AuditLog = {
    event_id: `evt_${Date.now()}`,
    event_time: new Date().toISOString(),
    actor_type: req.body.actor_type || 'system',
    actor_id: req.body.actor_id || 'system',
    actor_ip: req.ip || '127.0.0.1',
    action: req.body.action,
    resource_type: req.body.resource_type,
    resource_id: req.body.resource_id,
    status: req.body.status || 'success',
    details: req.body.details,
  }
  
  auditLogs.unshift(log)
  res.status(201).json({ success: true, data: log })
})

router.get('/score', (_req, res) => {
  res.json({
    success: true,
    data: {
      score: 85,
      status: 'good',
      checks: {
        totp_enabled: true,
        session_management: true,
        rbac_configured: true,
        audit_logging: true,
        ssrf_protection: true,
        safe_mode: false,
      },
    },
  })
})

router.get('/sessions', (_req, res) => {
  res.json({
    success: true,
    data: [
      {
        session_id: 'sess_001',
        user_id: 'admin',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        last_active: new Date().toISOString(),
        ip: '127.0.0.1',
        user_agent: 'Mozilla/5.0',
      },
    ],
  })
})

router.delete('/sessions/:id', (req, res) => {
  res.json({
    success: true,
    data: { message: `Session ${req.params.id} terminated` },
  })
})

export { router as securityRouter }
