import { Router } from 'express'
import { requireAuth, AuthRequest } from '../middleware/auth.js'
import { queries } from '../db/index.js'
import { createAuditLog } from '../services/auth.js'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

const CONFIG_FILES = [
  { name: 'SOUL', path: 'SOUL.md', description: 'Core identity configuration' },
  { name: 'AGENTS', path: 'AGENTS.md', description: 'Subagent definitions' },
  { name: 'USER', path: 'USER.md', description: 'User preferences' },
  { name: 'IDENTITY', path: 'IDENTITY.md', description: 'System identity' },
  { name: 'HEARTBEAT', path: 'HEARTBEAT.md', description: 'Scheduled tasks config' },
]

router.get('/list', requireAuth, (_req: AuthRequest, res) => {
  const files = CONFIG_FILES.map(f => {
    const latest = queries.configVersions.getLatest.get(f.path) as { version: string; created_at: string } | undefined
    return {
      ...f,
      exists: !!latest,
      version: latest?.version,
      last_modified: latest?.created_at,
    }
  })
  
  res.json({ success: true, data: files })
})

router.get('/file/:path', requireAuth, (req: AuthRequest, res) => {
  const { path: filePath } = req.params
  const version = queries.configVersions.getLatest.get(filePath)
  
  if (!version) {
    return res.json({ success: true, data: { content: '', version: null } })
  }
  
  res.json({ 
    success: true, 
    data: { 
      content: (version as { content: string }).content,
      version: (version as { version: string }).version,
      hash: (version as { hash: string }).hash,
      created_at: (version as { created_at: string }).created_at,
    }
  })
})

router.post('/save', requireAuth, (req: AuthRequest, res) => {
  const { path: filePath, content, reason } = req.body
  
  if (!filePath || content === undefined) {
    return res.status(400).json({ success: false, error: 'Path and content are required' })
  }
  
  if (!reason) {
    return res.status(400).json({ success: false, error: 'Reason is required for config changes' })
  }
  
  const versionId = uuidv4()
  const version = `v${Date.now()}`
  const hash = require('crypto').createHash('sha256').update(content).digest('hex')
  
  queries.configVersions.create.run({
    id: versionId,
    version,
    hash,
    file_path: filePath,
    content,
    created_by: req.user?.id,
  })
  
  createAuditLog({
    actor_id: req.user?.id,
    action: 'config_save',
    resource_type: 'config_file',
    resource_id: filePath,
    reason,
    risk_level: 'high',
  })
  
  res.json({ 
    success: true, 
    data: { 
      message: 'Configuration saved',
      version,
      version_id: versionId,
    }
  })
})

router.get('/versions/:path', requireAuth, (req: AuthRequest, res) => {
  const { path: filePath } = req.params
  const versions = queries.configVersions.findByPath.all(filePath)
  
  res.json({ success: true, data: versions })
})

router.post('/rollback', requireAuth, (req: AuthRequest, res) => {
  const { path: filePath, version_id, reason } = req.body
  
  if (!filePath || !version_id) {
    return res.status(400).json({ success: false, error: 'Path and version_id are required' })
  }
  
  if (!reason) {
    return res.status(400).json({ success: false, error: 'Reason is required for rollback' })
  }
  
  const targetVersion = queries.configVersions.findById.get(version_id)
  if (!targetVersion) {
    return res.status(404).json({ success: false, error: 'Target version not found' })
  }
  
  createAuditLog({
    actor_id: req.user?.id,
    action: 'config_rollback',
    resource_type: 'config_file',
    resource_id: filePath,
    before_ref: (targetVersion as { version: string }).version,
    reason,
    risk_level: 'high',
  })
  
  res.json({ 
    success: true, 
    data: { 
      message: 'Rollback completed',
      rolled_back_to: (targetVersion as { version: string }).version,
    }
  })
})

export { router as configRouter }
