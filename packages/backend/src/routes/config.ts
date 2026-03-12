import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

interface ConfigVersion {
  version: string
  hash: string
  created_at: string
  content: Record<string, unknown>
}

const configVersions: Map<string, ConfigVersion> = new Map()

const currentConfig: ConfigVersion = {
  version: 'v1.0.0',
  hash: uuidv4(),
  created_at: new Date().toISOString(),
  content: {
    model: {
      provider: 'openai',
      model: 'gpt-4',
      fallback: 'gpt-3.5-turbo',
    },
    budget: {
      limit: 100,
      period: 'monthly',
    },
    security: {
      totp_enabled: true,
      session_expiry: 3600,
    },
  },
}

configVersions.set(currentConfig.version, currentConfig)

router.get('/current', (_req, res) => {
  res.json({ 
    success: true, 
    data: {
      current_version: currentConfig.version,
      etag: currentConfig.hash,
      config: currentConfig.content,
    }
  })
})

router.post('/preview_diff', (req, res) => {
  const { old_version, new_config } = req.body
  
  const diff = {
    old_version,
    changes: Object.keys(new_config).map(key => ({
      path: key,
      old_value: '[REDACTED]',
      new_value: '[REDACTED]',
    })),
  }
  
  res.json({ success: true, data: diff })
})

router.post('/apply', (req, res) => {
  const { base_version, new_config, reason } = req.body
  
  if (!reason) {
    return res.status(400).json({ 
      success: false, 
      error: 'Reason is required for config changes' 
    })
  }
  
  const backup: ConfigVersion = {
    version: `v${Date.now()}`,
    hash: uuidv4(),
    created_at: new Date().toISOString(),
    content: { ...currentConfig.content },
  }
  
  configVersions.set(backup.version, backup)
  
  const newVersion: ConfigVersion = {
    version: `v${Date.now()}`,
    hash: uuidv4(),
    created_at: new Date().toISOString(),
    content: new_config,
  }
  
  configVersions.set(newVersion.version, newVersion)
  
  res.json({ 
    success: true, 
    data: {
      previous_version: currentConfig.version,
      new_version: newVersion.version,
      backup_version: backup.version,
      message: 'Config applied successfully',
    }
  })
})

router.post('/rollback', (req, res) => {
  const { target_version, reason } = req.body
  
  if (!reason) {
    return res.status(400).json({ 
      success: false, 
      error: 'Reason is required for rollback' 
    })
  }
  
  const targetConfig = configVersions.get(target_version)
  if (!targetConfig) {
    return res.status(404).json({ 
      success: false, 
      error: 'Target version not found' 
    })
  }
  
  res.json({ 
    success: true, 
    data: {
      rolled_back_to: target_version,
      timestamp: new Date().toISOString(),
      message: 'Rollback completed successfully',
    }
  })
})

router.get('/versions', (_req, res) => {
  const versions = Array.from(configVersions.values())
    .map(v => ({
      version: v.version,
      hash: v.hash,
      created_at: v.created_at,
    }))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  
  res.json({ success: true, data: versions })
})

export { router as configRouter }
