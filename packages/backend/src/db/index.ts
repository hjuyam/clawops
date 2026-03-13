import BetterSqlite3 from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'clawops.db')
const DB_DIR = path.dirname(DB_PATH)

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true })
}

const db: BetterSqlite3.Database = new BetterSqlite3(DB_PATH)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

export const migrations = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    totp_secret TEXT,
    totp_enabled INTEGER DEFAULT 0,
    role TEXT DEFAULT 'viewer' CHECK(role IN ('admin', 'operator', 'viewer')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  
  `CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    last_active TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  
  `CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id TEXT UNIQUE NOT NULL,
    event_time TEXT NOT NULL,
    actor_type TEXT,
    actor_id TEXT,
    actor_ip TEXT,
    session_id TEXT,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    policy_decision TEXT,
    risk_level TEXT DEFAULT 'low',
    before_ref TEXT,
    after_ref TEXT,
    diff_summary TEXT,
    status TEXT,
    error_code TEXT,
    error_message TEXT,
    duration_ms INTEGER,
    reason TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  
  `CREATE TABLE IF NOT EXISTS memories (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    source TEXT CHECK(source IN ('conversation', 'task', 'web', 'file')),
    pinned INTEGER DEFAULT 0,
    retention_days INTEGER DEFAULT 30,
    expires_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  
  `CREATE TABLE IF NOT EXISTS config_versions (
    id TEXT PRIMARY KEY,
    version TEXT NOT NULL,
    hash TEXT NOT NULL,
    file_path TEXT NOT NULL,
    content TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    is_valid INTEGER DEFAULT 1
  )`,
  
  `CREATE TABLE IF NOT EXISTS backups (
    id TEXT PRIMARY KEY,
    version_id TEXT,
    type TEXT CHECK(type IN ('full', 'incremental')),
    status TEXT CHECK(status IN ('pending', 'completed', 'failed')),
    size_bytes INTEGER,
    checksum TEXT,
    file_path TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    verified_at TEXT,
    FOREIGN KEY (version_id) REFERENCES config_versions(id)
  )`,
  
  `CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash)`,
  `CREATE INDEX IF NOT EXISTS idx_audit_logs_time ON audit_logs(event_time)`,
  `CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)`,
  `CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id)`,
  `CREATE INDEX IF NOT EXISTS idx_memories_source ON memories(source)`,
  `CREATE INDEX IF NOT EXISTS idx_memories_created ON memories(created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_config_versions_path ON config_versions(file_path)`,
]

export function runMigrations() {
  const migrate = db.transaction(() => {
    for (const sql of migrations) {
      db.exec(sql)
    }
  })
  migrate()
}

export interface User {
  id: string
  username: string
  password_hash: string
  totp_secret: string | null
  totp_enabled: number
  role: 'admin' | 'operator' | 'viewer'
  created_at: string
  updated_at: string
}

export interface Session {
  id: string
  user_id: string
  token_hash: string
  ip_address: string | null
  user_agent: string | null
  expires_at: string
  created_at: string
  last_active: string
}

export interface AuditLog {
  id: number
  event_id: string
  event_time: string
  actor_type: string | null
  actor_id: string | null
  actor_ip: string | null
  session_id: string | null
  action: string
  resource_type: string | null
  resource_id: string | null
  policy_decision: string | null
  risk_level: string
  before_ref: string | null
  after_ref: string | null
  diff_summary: string | null
  status: string | null
  error_code: string | null
  error_message: string | null
  duration_ms: number | null
  reason: string | null
  created_at: string
}

export interface Memory {
  id: string
  title: string
  content: string | null
  source: 'conversation' | 'task' | 'web' | 'file'
  pinned: number
  retention_days: number
  expires_at: string | null
  created_at: string
  updated_at: string
}

export interface ConfigVersion {
  id: string
  version: string
  hash: string
  file_path: string
  content: string | null
  created_at: string
  created_by: string | null
  is_valid: number
}

export interface Backup {
  id: string
  version_id: string | null
  type: 'full' | 'incremental'
  status: 'pending' | 'completed' | 'failed'
  size_bytes: number | null
  checksum: string | null
  file_path: string | null
  created_at: string
  verified_at: string | null
}

export const queries: Record<string, Record<string, BetterSqlite3.Statement>> = {
  users: {
    create: db.prepare('INSERT INTO users (id, username, password_hash, role) VALUES ($id, $username, $password_hash, $role)'),
    findById: db.prepare('SELECT * FROM users WHERE id = ?'),
    findByUsername: db.prepare('SELECT * FROM users WHERE username = ?'),
    updateTotp: db.prepare('UPDATE users SET totp_secret = $secret, totp_enabled = $enabled, updated_at = CURRENT_TIMESTAMP WHERE id = $id'),
    list: db.prepare('SELECT id, username, role, created_at FROM users'),
  },

  sessions: {
    create: db.prepare('INSERT INTO sessions (id, user_id, token_hash, ip_address, user_agent, expires_at) VALUES ($id, $user_id, $token_hash, $ip_address, $user_agent, $expires_at)'),
    findById: db.prepare('SELECT * FROM sessions WHERE id = ?'),
    findByToken: db.prepare('SELECT * FROM sessions WHERE token_hash = ?'),
    updateLastActive: db.prepare("UPDATE sessions SET last_active = CURRENT_TIMESTAMP WHERE id = ?"),
    delete: db.prepare('DELETE FROM sessions WHERE id = ?'),
    deleteByUser: db.prepare('DELETE FROM sessions WHERE user_id = $user_id AND id != $current_id'),
    deleteExpired: db.prepare('DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP'),
    listByUser: db.prepare('SELECT * FROM sessions WHERE user_id = ? ORDER BY last_active DESC'),
  },

  auditLogs: {
    create: db.prepare(`INSERT INTO audit_logs (event_id, event_time, actor_type, actor_id, actor_ip, session_id, action, resource_type, resource_id, policy_decision, risk_level, before_ref, after_ref, diff_summary, status, error_code, error_message, duration_ms, reason) VALUES ($event_id, $event_time, $actor_type, $actor_id, $actor_ip, $session_id, $action, $resource_type, $resource_id, $policy_decision, $risk_level, $before_ref, $after_ref, $diff_summary, $status, $error_code, $error_message, $duration_ms, $reason)`),
    list: db.prepare('SELECT * FROM audit_logs ORDER BY event_time DESC LIMIT $limit OFFSET $offset'),
    findByAction: db.prepare('SELECT * FROM audit_logs WHERE action = $action ORDER BY event_time DESC LIMIT $limit'),
    findByActor: db.prepare('SELECT * FROM audit_logs WHERE actor_id = $actor_id ORDER BY event_time DESC LIMIT $limit'),
  },

  memories: {
    create: db.prepare('INSERT INTO memories (id, title, content, source, retention_days, expires_at) VALUES ($id, $title, $content, $source, $retention_days, $expires_at)'),
    findById: db.prepare('SELECT * FROM memories WHERE id = ?'),
    list: db.prepare('SELECT * FROM memories ORDER BY created_at DESC LIMIT $limit OFFSET $offset'),
    search: db.prepare("SELECT * FROM memories WHERE title LIKE '%' || $query || '%' OR content LIKE '%' || $query || '%' ORDER BY created_at DESC LIMIT $limit"),
    update: db.prepare('UPDATE memories SET title = COALESCE($title, title), content = COALESCE($content, content), pinned = COALESCE($pinned, pinned), updated_at = CURRENT_TIMESTAMP WHERE id = $id'),
    delete: db.prepare('DELETE FROM memories WHERE id = ?'),
    deleteExpired: db.prepare('DELETE FROM memories WHERE expires_at IS NOT NULL AND expires_at < CURRENT_TIMESTAMP'),
  },

  configVersions: {
    create: db.prepare('INSERT INTO config_versions (id, version, hash, file_path, content, created_by) VALUES ($id, $version, $hash, $file_path, $content, $created_by)'),
    findById: db.prepare('SELECT * FROM config_versions WHERE id = ?'),
    findByPath: db.prepare('SELECT * FROM config_versions WHERE file_path = ? ORDER BY created_at DESC'),
    getLatest: db.prepare('SELECT * FROM config_versions WHERE file_path = ? ORDER BY created_at DESC LIMIT 1'),
    invalidate: db.prepare('UPDATE config_versions SET is_valid = 0 WHERE id = ?'),
  },
  
  backups: {
    create: db.prepare('INSERT INTO backups (id, version_id, type, file_path) VALUES ($id, $version_id, $type, $file_path)'),
    findById: db.prepare('SELECT * FROM backups WHERE id = ?'),
    complete: db.prepare('UPDATE backups SET status = \'completed\', size_bytes = $size_bytes, checksum = $checksum WHERE id = $id'),
    fail: db.prepare('UPDATE backups SET status = \'failed\', error_message = ? WHERE id = ?'),
    list: db.prepare('SELECT * FROM backups WHERE version_id = ? ORDER BY created_at DESC'),
  },
}

runMigrations()

export default db
