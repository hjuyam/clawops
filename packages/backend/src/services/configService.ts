import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { queries, ConfigVersion, Backup } from '../db/index.js'
import { createAuditLog } from '../services/auth.js'
import { v4 as uuidv4 } from 'uuid'

const CONFIG_DIR = process.env.CONFIG_DIR || path.join(process.cwd(), 'config')
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups')

export const CONFIG_FILES = [
  { name: 'SOUL', path: 'SOUL.md', description: 'Core identity configuration' },
  { name: 'AGENTS', path: 'AGENTS.md', description: 'Subagent definitions' },
  { name: 'USER', path: 'USER.md', description: 'User preferences' },
  { name: 'IDENTITY', path: 'IDENTITY.md', description: 'System identity' },
  { name: 'HEARTBEAT', path: 'HEARTBEAT.md', description: 'Scheduled tasks config' },
]

const SENSITIVE_PATTERNS = [
  { pattern: /(api[_-]?key\s*[:=]\s*['"]?)([a-zA-Z0-9_-]+)(['"]?)/gi, replace: '$1[REDACTED]$3' },
  { pattern: /(password\s*[:=]\s*['"]?)([^'"\n]+)(['"]?)/gi, replace: '$1[REDACTED]$3' },
  { pattern: /(secret\s*[:=]\s*['"]?)([a-zA-Z0-9_-]+)(['"]?)/gi, replace: '$1[REDACTED]$3' },
  { pattern: /(token\s*[:=]\s*['"]?)([a-zA-Z0-9_-]+)(['"]?)/gi, replace: '$1[REDACTED]$3' },
]

function ensureDirs() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true })
  }
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true })
  }
}

export function computeHash(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex')
}

export function redactSensitive(content: string): string {
  let result = content
  for (const { pattern, replace } of SENSITIVE_PATTERNS) {
    result = result.replace(pattern, replace)
  }
  return result
}

export function listConfigFiles(): Array<{
  name: string
  path: string
  description: string
  exists: boolean
  version?: string
  last_modified?: string
}> {
  ensureDirs()
  
  return CONFIG_FILES.map(file => {
    const filePath = path.join(CONFIG_DIR, file.path)
    const exists = fs.existsSync(filePath)
    const latestVersion = queries.configVersions.getLatest.get(file.path) as ConfigVersion | undefined
    
    return {
      ...file,
      exists,
      version: latestVersion?.version,
      last_modified: latestVersion?.created_at,
    }
  })
}

export function readFile(filePath: string): { content: string; hash: string } | null {
  ensureDirs()
  const fullPath = path.join(CONFIG_DIR, filePath)
  
  if (!fs.existsSync(fullPath)) {
    return null
  }
  
  const content = fs.readFileSync(fullPath, 'utf-8')
  return {
    content,
    hash: computeHash(content),
  }
}

export function writeFile(
  filePath: string,
  content: string,
  reason: string,
  userId: string
): { version: ConfigVersion; backup: Backup } {
  ensureDirs()
  
  const fullPath = path.join(CONFIG_DIR, filePath)
  const oldContent = fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf-8') : ''
  const oldHash = computeHash(oldContent)
  
  const backupId = uuidv4()
  const backupPath = path.join(BACKUP_DIR, `${filePath.replace(/\//g, '_')}.${Date.now()}.bak`)
  const backupDir = path.dirname(backupPath)
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }
  
  if (oldContent) {
    fs.writeFileSync(backupPath, oldContent)
  }
  
  const versionId = uuidv4()
  const version = `v${Date.now()}`
  const newHash = computeHash(content)
  
  fs.writeFileSync(fullPath, content)
  
  queries.configVersions.create.run({
    id: versionId,
    version,
    hash: newHash,
    file_path: filePath,
    content: redactSensitive(content),
    created_by: userId,
  })
  
  queries.backups.create.run({
    id: backupId,
    version_id: versionId,
    type: 'full',
    file_path: backupPath,
  })
  
  if (oldContent) {
    const backupStats = fs.statSync(backupPath)
    queries.backups.complete.run({
      id: backupId,
      size_bytes: backupStats.size,
      checksum: oldHash,
    })
  }
  
  createAuditLog({
    actor_id: userId,
    action: 'config_write',
    resource_type: 'config_file',
    resource_id: filePath,
    before_ref: oldHash.slice(0, 8),
    after_ref: newHash.slice(0, 8),
    reason,
    risk_level: 'high',
  })
  
  return {
    version: queries.configVersions.findById.get(versionId) as ConfigVersion,
    backup: queries.backups.findById.get(backupId) as Backup,
  }
}

export function createBackup(filePath: string, userId: string): Backup {
  ensureDirs()
  
  const fullPath = path.join(CONFIG_DIR, filePath)
  if (!fs.existsSync(fullPath)) {
    throw new Error('Config file does not exist')
  }
  
  const content = fs.readFileSync(fullPath, 'utf-8')
  const hash = computeHash(content)
  
  const versionId = uuidv4()
  queries.configVersions.create.run({
    id: versionId,
    version: `v${Date.now()}`,
    hash,
    file_path: filePath,
    content: redactSensitive(content),
    created_by: userId,
  })
  
  const backupId = uuidv4()
  const backupPath = path.join(BACKUP_DIR, `${filePath.replace(/\//g, '_')}.${Date.now()}.bak`)
  fs.copyFileSync(fullPath, backupPath)
  
  queries.backups.create.run({
    id: backupId,
    version_id: versionId,
    type: 'full',
    file_path: backupPath,
  })
  
  queries.backups.complete.run({
    id: backupId,
    size_bytes: fs.statSync(backupPath).size,
    checksum: hash,
  })
  
  createAuditLog({
    actor_id: userId,
    action: 'backup_create',
    resource_type: 'config_file',
    resource_id: filePath,
    risk_level: 'low',
  })
  
  return queries.backups.findById.get(backupId) as Backup
}

export function rollback(
  filePath: string,
  targetVersionId: string,
  reason: string,
  userId: string
): ConfigVersion {
  ensureDirs()
  
  const targetVersion = queries.configVersions.findById.get(targetVersionId) as ConfigVersion | undefined
  if (!targetVersion) {
    throw new Error('Target version not found')
  }
  
  const backups = queries.backups.list.all(targetVersionId) as Backup[]
  const backup = backups.find(b => b.status === 'completed')
  
  if (!backup || !backup.file_path || !fs.existsSync(backup.file_path)) {
    throw new Error('Backup file not found')
  }
  
  const fullPath = path.join(CONFIG_DIR, filePath)
  const currentContent = fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf-8') : ''
  const currentHash = computeHash(currentContent)
  
  const backupContent = fs.readFileSync(backup.file_path, 'utf-8')
  const backupHash = computeHash(backupContent)
  
  fs.writeFileSync(fullPath, backupContent)
  
  createAuditLog({
    actor_id: userId,
    action: 'config_rollback',
    resource_type: 'config_file',
    resource_id: filePath,
    before_ref: currentHash.slice(0, 8),
    after_ref: backupHash.slice(0, 8),
    reason,
    risk_level: 'high',
  })
  
  const newVersionId = uuidv4()
  queries.configVersions.create.run({
    id: newVersionId,
    version: `v${Date.now()}`,
    hash: backupHash,
    file_path: filePath,
    content: redactSensitive(backupContent),
    created_by: userId,
  })
  
  return queries.configVersions.findById.get(newVersionId) as ConfigVersion
}

export function getDiff(oldContent: string, newContent: string): Array<{
  type: 'added' | 'removed' | 'unchanged'
  content: string
  lineNumber: number
}> {
  const oldLines = oldContent.split('\n')
  const newLines = newContent.split('\n')
  const result: Array<{ type: 'added' | 'removed' | 'unchanged'; content: string; lineNumber: number }> = []
  
  const maxLen = Math.max(oldLines.length, newLines.length)
  
  for (let i = 0; i < maxLen; i++) {
    const oldLine = oldLines[i]
    const newLine = newLines[i]
    
    if (oldLine === undefined) {
      result.push({ type: 'added', content: newLine, lineNumber: i + 1 })
    } else if (newLine === undefined) {
      result.push({ type: 'removed', content: oldLine, lineNumber: i + 1 })
    } else if (oldLine === newLine) {
      result.push({ type: 'unchanged', content: oldLine, lineNumber: i + 1 })
    } else {
      result.push({ type: 'removed', content: oldLine, lineNumber: i + 1 })
      result.push({ type: 'added', content: newLine, lineNumber: i + 1 })
    }
  }
  
  return result
}

export function validateConfig(content: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!content || content.trim().length === 0) {
    errors.push('Content is empty')
    return { valid: false, errors }
  }
  
  if (content.includes('<script>')) {
    errors.push('Script tags are not allowed')
  }
  
  if (content.includes('eval(')) {
    errors.push('eval() is not allowed')
  }
  
  if (content.includes('javascript:')) {
    errors.push('javascript: URLs are not allowed')
  }
  
  return { valid: errors.length === 0, errors }
}

export function initDefaultConfigs() {
  ensureDirs()
  
  const defaultConfigs: Record<string, string> = {
    'SOUL.md': `# SOUL - Core Identity Configuration

This file defines the core identity and behavior of the OpenClaw agent.

## Identity
- Name: OpenClaw Agent
- Purpose: Assist users with various tasks
- Mode: Helpful, accurate, and safe

## Capabilities
- Code generation and review
- File operations
- Web browsing (when enabled)
- Memory management

## Constraints
- Never execute untrusted code
- Always validate inputs
- Protect sensitive information
`,
    'AGENTS.md': `# AGENTS - Subagent Definitions

This file defines specialized subagents for different tasks.

## Available Agents

### CodeAgent
- Purpose: Code generation and review
- Languages: TypeScript, Python, JavaScript

### ResearchAgent
- Purpose: Web research and information gathering
- Tools: Web search, content extraction

### MemoryAgent
- Purpose: Memory management and retrieval
- Operations: Store, search, organize

### OpsAgent
- Purpose: System operations
- Actions: Diagnostics, cleanup, backup
`,
    'USER.md': `# USER - User Preferences

This file stores user-specific preferences and settings.

## Preferences
- language: zh-CN
- theme: light
- notifications: true

## Limits
- max_tokens_per_request: 4096
- daily_budget_limit: 10.00
`,
    'IDENTITY.md': `# IDENTITY - System Identity

This file defines the system-level identity configuration.

## System Info
- version: 1.0.0
- environment: development
- log_level: info

## Security
- safe_mode: false
- allow_external_access: false
- require_confirmation: true
`,
    'HEARTBEAT.md': `# HEARTBEAT - Scheduled Tasks

This file defines scheduled tasks and maintenance operations.

## Tasks

### Daily Health Check
- schedule: "0 0 * * *"
- action: self_check
- enabled: true

### Weekly Backup
- schedule: "0 0 * * 0"
- action: create_backup
- enabled: true

### Monthly Cleanup
- schedule: "0 0 1 * *"
- action: cleanup
- enabled: true
`,
  }
  
  for (const [filename, content] of Object.entries(defaultConfigs)) {
    const fullPath = path.join(CONFIG_DIR, filename)
    if (!fs.existsSync(fullPath)) {
      fs.writeFileSync(fullPath, content)
      console.log(`Created default config: ${filename}`)
    }
  }
}
