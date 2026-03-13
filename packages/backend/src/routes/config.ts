import { Router } from 'express'
import { requireAuth, AuthRequest, auditAction } from '../middleware/auth.js'
import { queries, ConfigVersion } from '../db/index.js'
import { 
  listConfigFiles, 
  readFile, 
  writeFile, 
  createBackup,
  rollback,
  getDiff,
  validateConfig,
  initDefaultConfigs
} from '../services/configService.js'

const router = Router()

router.get('/list', requireAuth, (_req, res) => {
  const files = listConfigFiles()
  res.json({ success: true, data: files })
})

router.get('/file/:path', requireAuth, (req: AuthRequest, res) => {
  const { path: filePath } = req.params
  
  const fileData = readFile(filePath)
  
  if (!fileData) {
    return res.json({ 
      success: true, 
      data: { 
        content: '', 
        hash: '',
        version: null,
        exists: false
      } 
    })
  }
  
  const latestVersion = queries.configVersions.getLatest.get(filePath) as ConfigVersion | undefined
  
  res.json({
    success: true,
    data: {
      content: fileData.content,
      hash: fileData.hash,
      version: latestVersion?.version || null,
      created_at: latestVersion?.created_at || null,
      exists: true,
    },
  })
})

router.post('/save', requireAuth, auditAction('config_save'), (req: AuthRequest, res) => {
  const { path: filePath, content, reason } = req.body
  
  if (!filePath || content === undefined) {
    return res.status(400).json({ success: false, error: 'Path and content are required' })
  }
  
  if (!reason) {
    return res.status(400).json({ success: false, error: 'Reason is required for config changes' })
  }
  
  const validation = validateConfig(content)
  if (!validation.valid) {
    return res.status(400).json({ 
      success: false, 
      error: `Validation failed: ${validation.errors.join(', ')}` 
    })
  }
  
  try {
    const result = writeFile(filePath, content, reason, req.user?.id || 'system')
    
    res.json({
      success: true,
      data: {
        message: 'Configuration saved',
        version: result.version.version,
        version_id: result.version.id,
        backup_id: result.backup.id,
      },
    })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: `Save failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    })
  }
})

router.post('/backup', requireAuth, auditAction('config_backup'), (req: AuthRequest, res) => {
  const { path: filePath } = req.body
  
  if (!filePath) {
    return res.status(400).json({ success: false, error: 'Path is required' })
  }
  
  try {
    const backup = createBackup(filePath, req.user?.id || 'system')
    
    res.json({
      success: true,
      data: {
        message: 'Backup created',
        backup_id: backup.id,
        version_id: backup.version_id,
      },
    })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: `Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    })
  }
})

router.get('/versions/:path', requireAuth, (req: AuthRequest, res) => {
  const { path: filePath } = req.params
  const versions = queries.configVersions.findByPath.all(filePath)
  
  res.json({ success: true, data: versions })
})

router.get('/diff/:path', requireAuth, (req: AuthRequest, res) => {
  const { path: filePath } = req.params
  const { from_version, to_version } = req.query
  
  if (!from_version || !to_version) {
    return res.status(400).json({ 
      success: false, 
      error: 'from_version and to_version are required' 
    })
  }
  
  const fromVersion = queries.configVersions.findById.get(from_version as string) as ConfigVersion | undefined
  const toVersion = queries.configVersions.findById.get(to_version as string) as ConfigVersion | undefined
  
  if (!fromVersion || !toVersion) {
    return res.status(404).json({ success: false, error: 'Version not found' })
  }
  
  const diff = getDiff(fromVersion.content || '', toVersion.content || '')
  
  res.json({
    success: true,
    data: {
      file: filePath,
      from_version: fromVersion.version,
      to_version: toVersion.version,
      diff,
      additions: diff.filter(l => l.type === 'added').length,
      deletions: diff.filter(l => l.type === 'removed').length,
    },
  })
})

router.post('/rollback', requireAuth, auditAction('config_rollback'), (req: AuthRequest, res) => {
  const { path: filePath, version_id, reason } = req.body
  
  if (!filePath || !version_id) {
    return res.status(400).json({ success: false, error: 'Path and version_id are required' })
  }
  
  if (!reason) {
    return res.status(400).json({ success: false, error: 'Reason is required for rollback' })
  }
  
  try {
    const result = rollback(filePath, version_id, reason, req.user?.id || 'system')
    
    res.json({
      success: true,
      data: {
        message: 'Rollback completed',
        rolled_back_to: result.version,
        version_id: result.id,
      },
    })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: `Rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    })
  }
})

router.post('/validate', requireAuth, (req: AuthRequest, res) => {
  const { content } = req.body
  
  if (content === undefined) {
    return res.status(400).json({ success: false, error: 'Content is required' })
  }
  
  const result = validateConfig(content)
  
  res.json({
    success: true,
    data: {
      valid: result.valid,
      errors: result.errors,
    },
  })
})

router.post('/init', requireAuth, (_req, res) => {
  try {
    initDefaultConfigs()
    res.json({ 
      success: true, 
      data: { message: 'Default configurations initialized' } 
    })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: `Init failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    })
  }
})

export { router as configRouter }
