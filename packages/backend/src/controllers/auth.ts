import { Router, Response } from 'express'
import { AuthRequest, requireAuth, requireRole, auditAction } from '../middleware/auth.js'
import { 
  hashPassword, 
  verifyPassword, 
  generateTotpSecret, 
  verifyTotp, 
  createSession, 
  destroySession, 
  destroyOtherSessions,
  listUserSessions,
  createAuditLog,
  getTotpUrl,
  ensureDefaultAdmin,
} from '../services/auth.js'
import { queries } from '../db/index.js'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

router.post('/login', async (req, res: Response) => {
  const startTime = Date.now()
  
  try {
    const { username, password, totp_code, remember_device } = req.body
    
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required' })
    }
    
    await ensureDefaultAdmin()
    
    const user = queries.users.findByUsername.get(username) as { 
      id: string
      username: string
      password_hash: string
      totp_secret: string | null
      totp_enabled: number
      role: string
    } | undefined
    
    if (!user) {
      createAuditLog({
        actor_type: 'anonymous',
        actor_ip: req.ip,
        action: 'login_failed',
        status: 'failure',
        error_message: 'User not found',
        risk_level: 'medium',
      })
      return res.status(401).json({ success: false, error: 'Invalid credentials' })
    }
    
    const validPassword = await verifyPassword(password, user.password_hash)
    if (!validPassword) {
      createAuditLog({
        actor_type: 'anonymous',
        actor_ip: req.ip,
        action: 'login_failed',
        resource_type: 'user',
        resource_id: user.id,
        status: 'failure',
        error_message: 'Invalid password',
        risk_level: 'high',
      })
      return res.status(401).json({ success: false, error: 'Invalid credentials' })
    }
    
    if (user.totp_enabled) {
      if (!totp_code) {
        return res.status(200).json({ 
          success: true, 
          requires_totp: true,
          message: 'TOTP code required' 
        })
      }
      
      if (!user.totp_secret || !verifyTotp(user.totp_secret, totp_code)) {
        createAuditLog({
          actor_type: 'user',
          actor_id: user.id,
          actor_ip: req.ip,
          action: 'login_failed',
          resource_type: 'user',
          resource_id: user.id,
          status: 'failure',
          error_message: 'Invalid TOTP code',
          risk_level: 'high',
        })
        return res.status(401).json({ success: false, error: 'Invalid TOTP code' })
      }
    }
    
    const { session, token } = createSession(user.id, req.ip || null, req.headers['user-agent'] || null)
    
    const maxAge = remember_device ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000
    res.cookie('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge,
    })
    
    createAuditLog({
      actor_type: 'user',
      actor_id: user.id,
      actor_ip: req.ip,
      session_id: session.id,
      action: 'login',
      resource_type: 'session',
      resource_id: session.id,
      status: 'success',
      duration_ms: Date.now() - startTime,
    })
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
        session_id: session.id,
      },
    })
  } catch (error) {
    createAuditLog({
      actor_type: 'system',
      actor_ip: req.ip,
      action: 'login_error',
      status: 'failure',
      error_message: error instanceof Error ? error.message : 'Unknown error',
      risk_level: 'high',
    })
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

router.post('/logout', requireAuth, auditAction('logout'), (req: AuthRequest, res: Response) => {
  if (req.sessionId) {
    destroySession(req.sessionId)
  }
  
  res.clearCookie('session_token')
  res.json({ success: true, data: { message: 'Logged out successfully' } })
})

router.get('/me', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Not authenticated' })
  }

  const user = queries.users.findById.get(req.user.id) as { id: string; username: string; role: string; totp_enabled: number; created_at: string } | undefined

  res.json({
    success: true,
    data: {
      id: user?.id,
      username: user?.username,
      role: user?.role,
      totp_enabled: user?.totp_enabled,
      created_at: user?.created_at,
    },
  })
})

router.post('/totp/setup', requireAuth, requireRole(['admin', 'operator']), (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Not authenticated' })
  }
  
  const secret = generateTotpSecret()
  const url = getTotpUrl(req.user.username, secret)
  
  res.json({
    success: true,
    data: {
      secret,
      url,
      message: 'Scan the QR code with your authenticator app, then verify with POST /api/auth/totp/verify',
    },
  })
})

router.post('/totp/verify', requireAuth, auditAction('totp_verify'), (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Not authenticated' })
  }
  
  const { secret, code } = req.body
  
  if (!secret || !code) {
    return res.status(400).json({ success: false, error: 'Secret and code are required' })
  }
  
  if (!verifyTotp(secret, code)) {
    return res.status(400).json({ success: false, error: 'Invalid verification code' })
  }
  
  queries.users.updateTotp.run({ id: req.user.id, secret, enabled: 1 })
  
  res.json({ success: true, data: { message: 'TOTP enabled successfully' } })
})

router.post('/totp/disable', requireAuth, requireRole(['admin']), auditAction('totp_disable'), (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Not authenticated' })
  }
  
  queries.users.updateTotp.run({ id: req.user.id, secret: '', enabled: 0 })
  
  res.json({ success: true, data: { message: 'TOTP disabled successfully' } })
})

router.get('/sessions', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Not authenticated' })
  }
  
  const sessions = listUserSessions(req.user.id)
  
  res.json({
    success: true,
    data: sessions.map(s => ({
      id: s.id,
      ip_address: s.ip_address,
      user_agent: s.user_agent,
      created_at: s.created_at,
      last_active: s.last_active,
      expires_at: s.expires_at,
      is_current: s.id === req.sessionId,
    })),
  })
})

router.delete('/sessions/:id', requireAuth, auditAction('session_terminate'), (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Not authenticated' })
  }
  
  if (req.params.id === req.sessionId) {
    return res.status(400).json({ success: false, error: 'Cannot terminate current session' })
  }
  
  destroySession(req.params.id)
  
  res.json({ success: true, data: { message: 'Session terminated' } })
})

router.post('/sessions/terminate-others', requireAuth, auditAction('sessions_terminate_others'), (req: AuthRequest, res: Response) => {
  if (!req.user || !req.sessionId) {
    return res.status(401).json({ success: false, error: 'Not authenticated' })
  }
  
  destroyOtherSessions(req.user.id, req.sessionId)
  
  res.json({ success: true, data: { message: 'Other sessions terminated' } })
})

router.post('/setup-default', async (_req, res: Response) => {
  await ensureDefaultAdmin()
  res.json({ 
    success: true, 
    data: { 
      message: 'Default admin created',
      username: 'admin',
      password: 'admin123',
      note: 'Please change the default password immediately after first login',
    },
  })
})

export { router as authRouter }
