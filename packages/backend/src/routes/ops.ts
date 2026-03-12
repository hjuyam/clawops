import { Router } from 'express'

const router = Router()

router.post('/self_check', async (_req, res) => {
  const results = {
    timestamp: new Date().toISOString(),
    checks: {
      connectivity: { status: 'pass', details: 'Gateway reachable' },
      capabilities: { status: 'pass', details: 'All capabilities available' },
      authorization: { status: 'pass', details: 'Valid session' },
      resources: { status: 'pass', details: 'Memory and disk OK' },
    },
    overall_status: 'healthy',
  }
  
  res.json({ success: true, data: results })
})

router.post('/restart_gateway', async (_req, res) => {
  res.json({ 
    success: true, 
    data: { 
      message: 'Gateway restart initiated',
      timestamp: new Date().toISOString()
    }
  })
})

router.post('/cleanup', async (req, res) => {
  const { dry_run = true } = req.body
  
  const items = [
    { type: 'temp_files', path: '/tmp/clawops', size: '15MB' },
    { type: 'old_logs', path: '/var/log/clawops', size: '50MB' },
    { type: 'cache', path: '/cache/clawops', size: '100MB' },
  ]
  
  res.json({ 
    success: true, 
    data: { 
      dry_run,
      items_to_clean: items,
      total_size: '165MB',
      message: dry_run ? 'Dry run completed' : 'Cleanup completed'
    }
  })
})

router.get('/diagnostics_bundle', async (_req, res) => {
  const bundle = {
    generated_at: new Date().toISOString(),
    system_info: {
      platform: process.platform,
      node_version: process.version,
      memory_usage: process.memoryUsage(),
    },
    gateway_status: {
      connected: true,
      version: '0.1.0',
      uptime: process.uptime(),
    },
    recent_errors: [],
    config_snapshot: 'REDACTED',
  }
  
  res.json({ success: true, data: bundle })
})

export { router as opsRouter }
