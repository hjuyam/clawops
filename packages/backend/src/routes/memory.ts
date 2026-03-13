import { Router } from 'express'
import { requireAuth, AuthRequest } from '../middleware/auth.js'
import { queries, Memory } from '../db/index.js'
import { v4 as uuidv4 } from 'uuid'
import { createAuditLog } from '../services/auth.js'

const router = Router()

router.get('/', requireAuth, (req: AuthRequest, res) => {
  const { source, pinned, limit = 50, offset = 0 } = req.query
  
  let memories = queries.memories.list.all({ limit: Number(limit), offset: Number(offset) }) as Memory[]
  
  if (source && source !== 'all') {
    memories = memories.filter(m => m.source === source)
  }
  
  if (pinned === 'true') {
    memories = memories.filter(m => m.pinned === 1)
  }
  
  res.json({ success: true, data: memories })
})

router.post('/', requireAuth, (req: AuthRequest, res) => {
  const { title, content, source, retention_days } = req.body
  
  if (!title) {
    return res.status(400).json({ success: false, error: 'Title is required' })
  }
  
  const id = uuidv4()
  const expiresAt = retention_days 
    ? new Date(Date.now() + retention_days * 24 * 60 * 60 * 1000).toISOString()
    : null
  
  queries.memories.create.run({
    id,
    title,
    content: content || '',
    source: source || 'conversation',
    retention_days: retention_days || 30,
    expires_at: expiresAt,
  })
  
  createAuditLog({
    actor_id: req.user?.id,
    action: 'memory_create',
    resource_type: 'memory',
    resource_id: id,
  })
  
  const memory = queries.memories.findById.get(id)
  res.status(201).json({ success: true, data: memory })
})

router.get('/search', requireAuth, (req: AuthRequest, res) => {
  const { q, limit = 20 } = req.query
  
  if (!q) {
    return res.status(400).json({ success: false, error: 'Search query is required' })
  }
  
  const memories = queries.memories.search.all({ query: String(q), limit: Number(limit) })
  res.json({ success: true, data: memories })
})

router.get('/:id', requireAuth, (req: AuthRequest, res) => {
  const memory = queries.memories.findById.get(req.params.id)
  
  if (!memory) {
    return res.status(404).json({ success: false, error: 'Memory not found' })
  }
  
  res.json({ success: true, data: memory })
})

router.patch('/:id', requireAuth, (req: AuthRequest, res) => {
  const { title, content, pinned } = req.body
  
  const memory = queries.memories.findById.get(req.params.id)
  if (!memory) {
    return res.status(404).json({ success: false, error: 'Memory not found' })
  }
  
  queries.memories.update.run({
    id: req.params.id,
    title,
    content,
    pinned: pinned !== undefined ? (pinned ? 1 : 0) : undefined,
  })
  
  const updated = queries.memories.findById.get(req.params.id)
  res.json({ success: true, data: updated })
})

router.delete('/:id', requireAuth, (req: AuthRequest, res) => {
  const memory = queries.memories.findById.get(req.params.id)
  if (!memory) {
    return res.status(404).json({ success: false, error: 'Memory not found' })
  }
  
  queries.memories.delete.run(req.params.id)
  
  createAuditLog({
    actor_id: req.user?.id,
    action: 'memory_delete',
    resource_type: 'memory',
    resource_id: req.params.id,
    risk_level: 'medium',
  })
  
  res.json({ success: true, data: { message: 'Memory deleted' } })
})

router.post('/:id/pin', requireAuth, (req: AuthRequest, res) => {
  const memory = queries.memories.findById.get(req.params.id) as Memory | undefined
  if (!memory) {
    return res.status(404).json({ success: false, error: 'Memory not found' })
  }

  queries.memories.update.run({
    id: req.params.id,
    pinned: memory.pinned === 1 ? 0 : 1,
  })

  const updated = queries.memories.findById.get(req.params.id)
  res.json({ success: true, data: updated })
})

router.get('/stats/overview', requireAuth, (_req, res) => {
  const all = queries.memories.list.all({ limit: 10000, offset: 0 }) as Memory[]
  const pinned = all.filter((m: Memory) => m.pinned === 1).length
  
  res.json({
    success: true,
    data: {
      total: all.length,
      pinned,
    }
  })
})

export { router as memoryRouter }
