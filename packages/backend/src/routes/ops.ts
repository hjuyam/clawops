import { Router } from 'express'
import { requireAuth, AuthRequest, auditAction } from '../middleware/auth.js'
import { createAuditLog } from '../services/auth.js'
import { 
  runSelfCheck, 
  generateDiagnosticsBundle, 
  restartGateway, 
  performCleanup,
  checkGatewayHealth 
} from '../gateway/index.js'
import { listConfigFiles, createBackup, initDefaultConfigs } from '../services/configService.js'

const router = Router()

router.post('/self_check', requireAuth, auditAction('self_check'), async (_req, res) => {
  try {
    const results = await runSelfCheck()
    res.json({ success: true, data: results })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: `Self-check failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    })
  }
})

router.post('/restart_gateway', requireAuth, auditAction('restart_gateway'), async (req: AuthRequest, res) => {
  try {
    createAuditLog({
      actor_id: req.user?.id,
      action: 'restart_gateway',
      resource_type: 'gateway',
      risk_level: 'high',
    })
    
    const result = await restartGateway()
    res.json({ success: result.success, data: { message: result.message } })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: `Restart failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    })
  }
})

router.post('/cleanup', requireAuth, auditAction('cleanup'), async (req: AuthRequest, res) => {
  try {
    const { dry_run = true } = req.body
    
    createAuditLog({
      actor_id: req.user?.id,
      action: 'cleanup',
      resource_type: 'system',
      risk_level: dry_run ? 'low' : 'medium',
      reason: dry_run ? 'Dry run' : 'Actual cleanup',
    })
    
    const result = await performCleanup(dry_run)
    res.json({ success: true, data: result })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: `Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    })
  }
})

router.get('/diagnostics_bundle', requireAuth, auditAction('diagnostics_export'), async (_req, res) => {
  try {
    const bundle = await generateDiagnosticsBundle()
    res.json({ success: true, data: bundle })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: `Diagnostics generation failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    })
  }
})

router.get('/gateway_status', requireAuth, async (_req, res) => {
  try {
    const status = await checkGatewayHealth()
    res.json({ success: true, data: status })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: `Status check failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    })
  }
})

router.post('/backup_all', requireAuth, auditAction('backup_all'), async (req: AuthRequest, res) => {
  try {
    const files = listConfigFiles()
    const results: Array<{ file: string; success: boolean; error?: string }> = []
    
    for (const file of files) {
      if (file.exists) {
        try {
          createBackup(file.path, req.user?.id || 'system')
          results.push({ file: file.name, success: true })
        } catch (error) {
          results.push({ 
            file: file.name, 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          })
        }
      }
    }
    
    createAuditLog({
      actor_id: req.user?.id,
      action: 'backup_all',
      resource_type: 'config_files',
      risk_level: 'low',
    })
    
    res.json({ 
      success: true, 
      data: { 
        message: `Backed up ${results.filter(r => r.success).length} of ${files.length} files`,
        results 
      } 
    })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: `Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    })
  }
})

router.post('/init_configs', requireAuth, requireAuth, async (_req, res) => {
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

export { router as opsRouter }
