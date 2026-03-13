import { Router } from 'express'
import { requireAuth, AuthRequest } from '../middleware/auth.js'
import { queries, AuditLog, Session } from '../db/index.js'

const router = Router()

router.get('/logs', requireAuth, (req: AuthRequest, res) => {
  const { action, actor_id, status, limit = 100, offset = 0 } = req.query
  
  let logs = queries.auditLogs.list.all({ limit: Number(limit), offset: Number(offset) }) as AuditLog[]
  
  if (action) {
    logs = logs.filter(l => l.action === action)
  }
  
  if (actor_id) {
    logs = logs.filter(l => l.actor_id === actor_id)
  }
  
  if (status) {
    logs = logs.filter(l => l.status === status)
  }
  
  res.json({ success: true, data: logs })
})

router.get('/logs/:id', requireAuth, (req: AuthRequest, res) => {
  const allLogs = queries.auditLogs.list.all({ limit: 10000, offset: 0 }) as AuditLog[]
  const log = allLogs.find(l => l.event_id === req.params.id)
  
  if (!log) {
    return res.status(404).json({ success: false, error: 'Log not found' })
  }
  
  res.json({ success: true, data: log })
})

router.get('/score', requireAuth, (_req, res) => {
  const logs = queries.auditLogs.list.all({ limit: 100, offset: 0 }) as AuditLog[]
  
  const failedActions = logs.filter(l => l.status === 'failure').length
  const highRiskActions = logs.filter(l => l.risk_level === 'high').length
  
  let score = 100
  score -= failedActions * 2
  score -= highRiskActions * 1
  score = Math.max(0, Math.min(100, score))
  
  let status: 'good' | 'warning' | 'danger' = 'good'
  if (score < 70) status = 'danger'
  else if (score < 90) status = 'warning'
  
  res.json({
    success: true,
    data: {
      score,
      status,
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

router.get('/sessions', requireAuth, (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Not authenticated' })
  }
  
  const sessions = queries.sessions.listByUser.all(req.user.id) as Session[]

  res.json({
    success: true,
    data: sessions.map(s => ({
      id: s.id,
      ip_address: s.ip_address,
      user_agent: s.user_agent,
      created_at: s.created_at,
      last_active: s.last_active,
      expires_at: s.expires_at,
    })),
  })
})

router.delete('/sessions/:id', requireAuth, (req: AuthRequest, res) => {
  queries.sessions.delete.run(req.params.id)
  res.json({ success: true, data: { message: 'Session terminated' } })
})

router.get('/export', requireAuth, (req: AuthRequest, res) => {
  const logs = queries.auditLogs.list.all({ limit: 10000, offset: 0 })
  
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Content-Disposition', 'attachment; filename=audit_logs.json')
  res.json(logs)
})

export { router as securityRouter }
