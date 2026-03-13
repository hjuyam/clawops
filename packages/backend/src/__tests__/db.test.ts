import assert from 'assert'
import Database from 'better-sqlite3'
import { runMigrations, queries } from '../db/index.js'

function setupTestDb() {
  const db = new Database(':memory:')
  db.pragma('foreign_keys = ON')
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      totp_secret TEXT,
      totp_enabled INTEGER DEFAULT 0,
      role TEXT DEFAULT 'viewer',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_active TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS memories (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT,
      source TEXT,
      pinned INTEGER DEFAULT 0,
      retention_days INTEGER DEFAULT 30,
      expires_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id TEXT UNIQUE NOT NULL,
      event_time TEXT NOT NULL,
      actor_type TEXT,
      actor_id TEXT,
      action TEXT NOT NULL,
      resource_type TEXT,
      resource_id TEXT,
      status TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  return db
}

function testUserOperations() {
  const db = setupTestDb()
  
  const insert = db.prepare('INSERT INTO users (id, username, password_hash, role) VALUES (?, ?, ?, ?)')
  insert.run('user-1', 'testuser', 'hashedpassword123', 'admin')
  
  const find = db.prepare('SELECT * FROM users WHERE username = ?')
  const user = find.get('testuser') as { id: string; username: string; role: string }
  
  assert.strictEqual(user.id, 'user-1')
  assert.strictEqual(user.username, 'testuser')
  assert.strictEqual(user.role, 'admin')
  
  db.exec("UPDATE users SET role = 'operator' WHERE id = 'user-1'")
  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get('user-1') as { role: string }
  assert.strictEqual(updated.role, 'operator')
  
  db.exec("DELETE FROM users WHERE id = 'user-1'")
  const deleted = db.prepare('SELECT * FROM users WHERE id = ?').get('user-1')
  assert.strictEqual(deleted, undefined)
  
  db.close()
  console.log('✓ User CRUD operations passed')
}

function testSessionOperations() {
  const db = setupTestDb()
  
  db.prepare('INSERT INTO users (id, username, password_hash, role)').run('user-1', 'testuser', 'hash', 'admin')
  
  db.prepare(`
    INSERT INTO sessions (id, user_id, token_hash, expires_at)
    VALUES (?, ?, ?, datetime('now', '+1 hour'))
  `).run('session-1', 'user-1', 'tokenhash123')
  
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get('session-1') as { user_id: string }
  assert.strictEqual(session.user_id, 'user-1')
  
  db.prepare("UPDATE sessions SET last_active = datetime('now') WHERE id = ?").run('session-1')
  
  db.prepare('DELETE FROM sessions WHERE id = ?').run('session-1')
  const deleted = db.prepare('SELECT * FROM sessions WHERE id = ?').get('session-1')
  assert.strictEqual(deleted, undefined)
  
  db.close()
  console.log('✓ Session operations passed')
}

function testMemoryOperations() {
  const db = setupTestDb()
  
  db.prepare(`
    INSERT INTO memories (id, title, content, source, pinned)
    VALUES (?, ?, ?, ?, ?)
  `).run('mem-1', 'Test Memory', 'Some content', 'conversation', 0)
  
  const memory = db.prepare('SELECT * FROM memories WHERE id = ?').get('mem-1') as { title: string; pinned: number }
  assert.strictEqual(memory.title, 'Test Memory')
  assert.strictEqual(memory.pinned, 0)
  
  db.prepare('UPDATE memories SET pinned = 1 WHERE id = ?').run('mem-1')
  const updated = db.prepare('SELECT pinned FROM memories WHERE id = ?').get('mem-1') as { pinned: number }
  assert.strictEqual(updated.pinned, 1)
  
  db.prepare('DELETE FROM memories WHERE id = ?').run('mem-1')
  
  db.close()
  console.log('✓ Memory operations passed')
}

function testAuditLogOperations() {
  const db = setupTestDb()
  
  db.prepare(`
    INSERT INTO audit_logs (event_id, event_time, actor_type, actor_id, action, status)
    VALUES (?, datetime('now'), ?, ?, ?, ?)
  `).run('evt-1', 'user', 'user-1', 'login', 'success')
  
  const log = db.prepare('SELECT * FROM audit_logs WHERE event_id = ?').get('evt-1') as { action: string; status: string }
  assert.strictEqual(log.action, 'login')
  assert.strictEqual(log.status, 'success')
  
  const count = db.prepare('SELECT COUNT(*) as count FROM audit_logs').get() as { count: number }
  assert.strictEqual(count.count, 1)
  
  db.close()
  console.log('✓ Audit log operations passed')
}

function runTests() {
  console.log('Running database tests...\n')
  
  testUserOperations()
  testSessionOperations()
  testMemoryOperations()
  testAuditLogOperations()
  
  console.log('\n✅ All database tests passed!')
}

runTests()
