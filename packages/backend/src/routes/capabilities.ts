import { Router } from 'express'

const router = Router()

router.get('/', (_req, res) => {
  res.json({
    gateway_version: '0.1.0',
    deployment: 'local',
    auth_support: ['session', 'totp'],
    supports_sse: true,
    supports_browser: true,
    supports_nodes: true,
    supports_memory: true,
    supports_config_edit: true,
    supported_channels: ['openai', 'anthropic', 'local'],
  })
})

export { router as capabilitiesRouter }
