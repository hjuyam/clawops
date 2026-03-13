import { Request, Response, NextFunction } from 'express'
import { validateSession, createAuditLog } from '../services/auth.js'
import { queries } from '../db/index.js'
import { v4 as uuidv4 } from 'uuid'

export interface AuthRequest extends Request {
  user?: {
    id: string
    username: string
    role: 'admin' | 'operator' | 'viewer'
  }
  sessionId?: string
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.session_token || req.headers.authorization?.replace('Bearer ', '')
  
  if (!token) {
    return res.status(401).json({ success: false, error: 'No authentication token provided' })
  }
  
  const result = validateSession(token)
  
  if (!result) {
    return res.status(401).json({ success: false, error: 'Invalid or expired session' })
  }
  
  req.user = {
    id: result.user.id,
    username: result.user.username,
    role: result.user.role,
  }
  req.sessionId = result.session.id
  
  next()
}

export function requireRole(roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' })
    }
    
    if (!roles.includes(req.user.role)) {
      createAuditLog({
        actor_id: req.user.id,
        actor_ip: req.ip,
        action: 'unauthorized_access',
        resource_type: 'endpoint',
        resource_id: req.path,
        status: 'failure',
        error_message: `Role ${req.user.role} not in allowed roles: ${roles.join(', ')}`,
        risk_level: 'medium',
      })
      return res.status(403).json({ success: false, error: 'Insufficient permissions' })
    }
    
    next()
  }
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const token = req.cookies?.session_token || req.headers.authorization?.replace('Bearer ', '')
  
  if (token) {
    const result = validateSession(token)
    if (result) {
      req.user = {
        id: result.user.id,
        username: result.user.username,
        role: result.user.role,
      }
      req.sessionId = result.session.id
    }
  }
  
  next()
}

export function auditAction(action: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const startTime = Date.now()
    
    const originalJson = res.json.bind(res)
    res.json = (body: unknown) => {
      const duration = Date.now() - startTime
      
      createAuditLog({
        event_id: uuidv4(),
        actor_type: req.user ? 'user' : 'system',
        actor_id: req.user?.id || 'system',
        actor_ip: req.ip || '127.0.0.1',
        session_id: req.sessionId,
        action,
        resource_type: req.params.id ? req.path.split('/')[2] : null,
        resource_id: req.params.id || null,
        status: body && typeof body === 'object' && 'success' in body && (body as { success: boolean }).success ? 'success' : 'failure',
        duration_ms: duration,
        risk_level: action.includes('delete') || action.includes('rollback') ? 'high' : 'low',
      })
      
      return originalJson(body)
    }
    
    next()
  }
}
