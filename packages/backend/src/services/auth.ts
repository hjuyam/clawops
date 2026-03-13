import crypto from 'crypto'
import { queries, User, Session, AuditLog } from '../db/index.js'
import { v4 as uuidv4 } from 'uuid'

const SESSION_DURATION_HOURS = 24
const TOKEN_LENGTH = 32

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256').toString('hex')
  return `${salt}:${hash}`
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, hash] = storedHash.split(':')
  const computedHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256').toString('hex')
  return hash === computedHash
}

export function generateTotpSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let secret = ''
  const randomBytes = crypto.randomBytes(20)
  for (let i = 0; i < 16; i++) {
    secret += chars[randomBytes[i] % chars.length]
  }
  return secret
}

export function verifyTotp(secret: string, code: string, window: number = 1): boolean {
  const counter = Math.floor(Date.now() / 1000 / 30)
  
  for (let i = -window; i <= window; i++) {
    const expectedCode = generateTotpCode(secret, counter + i)
    if (code === expectedCode) {
      return true
    }
  }
  return false
}

function generateTotpCode(secret: string, counter: number): string {
  const key = base32Decode(secret)
  const counterBuffer = Buffer.alloc(8)
  counterBuffer.writeBigUInt64BE(BigInt(counter), 0)
  
  const hmac = crypto.createHmac('sha1', key)
  hmac.update(counterBuffer)
  const digest = hmac.digest()
  
  const offset = digest[digest.length - 1] & 0x0f
  const code = ((digest[offset] & 0x7f) << 24 |
                (digest[offset + 1] & 0xff) << 16 |
                (digest[offset + 2] & 0xff) << 8 |
                (digest[offset + 3] & 0xff)) % 1000000
  
  return code.toString().padStart(6, '0')
}

function base32Decode(str: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  str = str.toUpperCase().replace(/[^A-Z2-7]/g, '')
  
  const bits: number[] = []
  for (const char of str) {
    const val = alphabet.indexOf(char)
    if (val === -1) continue
    bits.push((val >> 4) & 1)
    bits.push((val >> 3) & 1)
    bits.push((val >> 2) & 1)
    bits.push((val >> 1) & 1)
    bits.push(val & 1)
  }
  
  const bytes: number[] = []
  for (let i = 0; i < bits.length - 7; i += 8) {
    let byte = 0
    for (let j = 0; j < 8; j++) {
      byte = (byte << 1) | bits[i + j]
    }
    bytes.push(byte)
  }
  
  return Buffer.from(bytes)
}

export function generateToken(): string {
  return crypto.randomBytes(TOKEN_LENGTH).toString('hex')
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function createSession(userId: string, ip: string | null, userAgent: string | null): { session: Session; token: string } {
  const sessionId = uuidv4()
  const token = generateToken()
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000).toISOString()
  
  queries.sessions.create.run({
    id: sessionId,
    user_id: userId,
    token_hash: tokenHash,
    ip_address: ip,
    user_agent: userAgent,
    expires_at: expiresAt,
  })
  
  const session = queries.sessions.findById.get(sessionId) as Session
  return { session, token }
}

export function validateSession(token: string): { user: User; session: Session } | null {
  const tokenHash = hashToken(token)
  const session = queries.sessions.findByToken.get(tokenHash) as Session | undefined
  
  if (!session) return null
  
  if (new Date(session.expires_at) < new Date()) {
    queries.sessions.delete.run(session.id)
    return null
  }
  
  const user = queries.users.findById.get(session.user_id) as User | undefined
  if (!user) return null
  
  queries.sessions.updateLastActive.run(session.id)
  
  return { user, session }
}

export function destroySession(sessionId: string): void {
  queries.sessions.delete.run(sessionId)
}

export function destroyOtherSessions(userId: string, currentSessionId: string): void {
  queries.sessions.deleteByUser.run({ user_id: userId, current_id: currentSessionId })
}

export function listUserSessions(userId: string): Session[] {
  return queries.sessions.listByUser.all(userId) as Session[]
}

export function createAuditLog(entry: Partial<AuditLog>): void {
  queries.auditLogs.create.run({
    event_id: entry.event_id || uuidv4(),
    event_time: entry.event_time || new Date().toISOString(),
    actor_type: entry.actor_type || 'system',
    actor_id: entry.actor_id || null,
    actor_ip: entry.actor_ip || null,
    session_id: entry.session_id || null,
    action: entry.action || 'unknown',
    resource_type: entry.resource_type || null,
    resource_id: entry.resource_id || null,
    policy_decision: entry.policy_decision || null,
    risk_level: entry.risk_level || 'low',
    before_ref: entry.before_ref || null,
    after_ref: entry.after_ref || null,
    diff_summary: entry.diff_summary || null,
    status: entry.status || 'success',
    error_code: entry.error_code || null,
    error_message: entry.error_message || null,
    duration_ms: entry.duration_ms || null,
    reason: entry.reason || null,
  })
}

export async function ensureDefaultAdmin(): Promise<User> {
  const existingAdmin = queries.users.findByUsername.get('admin') as User | undefined

  if (existingAdmin) return existingAdmin

  const adminId = uuidv4()
  const defaultPassword = 'admin123'
  const hash = await hashPassword(defaultPassword)

  queries.users.create.run({
    id: adminId,
    username: 'admin',
    password_hash: hash,
    role: 'admin',
  })

  return {
    id: adminId,
    username: 'admin',
    password_hash: hash,
    totp_secret: null,
    totp_enabled: 0,
    role: 'admin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

export function getTotpUrl(username: string, secret: string): string {
  const issuer = encodeURIComponent('ClawOps')
  const account = encodeURIComponent(username)
  return `otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`
}
