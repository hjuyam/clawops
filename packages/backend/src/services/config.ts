import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { queries, ConfigVersion, Backup } from '../db/index.js'
import { createAuditLog } from '../services/auth.js'
import { v4 as uuidv4 } from 'uuid'

const CONFIG_DIR = process.env.CONFIG_DIR || path.join(process.cwd(), 'config')
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups')

export interface ConfigFile {
  name: string
  path: string
  description: string
  exists: boolean
}

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged'
  content: string
  lineNumber: number
}

export interface Diff {
  file: string
  lines: DiffLine[]
  additions: number
  deletions: number
}

const CONFIG_FILES: Omit<ConfigFile, 'exists'>[] = [
  { name: 'SOUL', path: 'SOUL.md', description: 'Core identity configuration' },
  { name: 'AGENTS', path: 'AGENTS.md', description: 'Subagent definitions' },
  { name: 'USER', path: 'USER.md', description: 'User preferences' },
  { name: 'IDENTITY', path: 'IDENTITY.md', description: 'System identity' },
  { name: 'HEARTBEAT', path: 'HEARTBEAT.md', description: 'Scheduled tasks config' },
]

function ensureDirs() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true })
  }
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true })
  }
}

export function listConfigFiles(): ConfigFile[] {
  ensureDirs()
  
  return CONFIG_FILES.map(file => ({
    ...file,
    path: path.join(CONFIG_DIR, file.path),
    exists: fs.existsSync(path.join(CONFIG_DIR, file.path)),
  }))
}

export function readFile(relativePath: string): string | null {
  ensureDirs()
  const filePath = path.join(CONFIG_DIR, relativePath)
  
  if (!fs.existsSync(filePath)) {
    return null
  }
  
  return fs.readFileSync(filePath, 'utf-8')
}

function computeHash(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex')
}

const SENSITIVE_PATTERNS = [
  /api[_-]?key\s*[:=]\s*['"]?([a-zA-Z0-9_-]+)['"]?/gi,
  /password\s*[:=]\s*['"]?([^'"\n]+)['"]?/gi,
  /secret\s*[:=]\s*['"]?([a-zA-Z0-9_-]+)['"]?/gi,
  /token\s*[:=]\s*['"]?([a-zA-Z0-9_-]+)['"]?/gi,
]

function redactSensitive(content: string): string {
  let result = content
  for (const pattern of SENSITIVE_PATTERNS) {
    result = result.replace(pattern, (match, _group) => {
      return match.replace(_group, '[REDACTED]')
    })
  }
  return result
}

export function writeFile(
  relativePath: string, 
  content: string, 
  reason: string, 
  userId: string
): { version: ConfigVersion; backup: Backup } {
  ensureDirs()
  
  const filePath = path.join(CONFIG_DIR, relativePath)
  const oldContent = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : ''
  const oldHash = computeHash(oldContent)
  
  const backupId = uuidv4()
  const backupPath = path.join(BACKUP_DIR, `${relativePath}.${Date.now()}.bak`)
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
  
  fs.writeFileSync(filePath, content)
  
  queries.configVersions.create.run({
    id: versionId,
    version,
    hash: newHash,
    file_path: relativePath,
    content: redactSensitive(content),
    created_by: userId,
  })
  
  const backupSize = oldContent ? fs.statSync(backupPath).size : 0
  queries.backups.create.run({
    id: backupId,
    version_id: versionId,
    type: 'full',
    file_path: backupPath,
  })
  
  if (oldContent) {
    queries.backups.complete.run({
      id: backupId,
      size_bytes: backupSize,
      checksum: oldHash,
    })
  }
  
  createAuditLog({
    actor_id: userId,
    action: 'config_write',
    resource_type: 'config_file',
    resource_id: relativePath,
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

export function createBackup(relativePath: string, userId: string): Backup {
  ensureDirs()
  
  const filePath = path.join(CONFIG_DIR, relativePath)
  if (!fs.existsSync(filePath)) {
    throw new Error('Config file does not exist')
  }
  
  const content = fs.readFileSync(filePath, 'utf-8')
  const hash = computeHash(content)
  
  const versionId = uuidv4()
  queries.configVersions.create.run({
    id: versionId,
    version: `v${Date.now()}`,
    hash,
    file_path: relativePath,
    content: redactSensitive(content),
    created_by: userId,
  })
  
  const backupId = uuidv4()
  const backupPath = path.join(BACKUP_DIR, `${relativePath}.${Date.now()}.bak`)
  fs.copyFileSync(filePath, backupPath)
  
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
    resource_id: relativePath,
    risk_level: 'low',
  })
  
  return queries.backups.findById.get(backupId) as Backup
}

export function listVersions(relativePath: string): ConfigVersion[] {
  return queries.configVersions.findByPath.all(relativePath) as ConfigVersion[]
}

export function getDiff(oldContent: string, newContent: string): DiffLine[] {
  const oldLines = oldContent.split('\n')
  const newLines = newContent.split('\n')
  const diffLines: DiffLine[] = []
  
  const maxLen = Math.max(oldLines.length, newLines.length)
  
  for (let i = 0; i < maxLen; i++) {
    const oldLine = oldLines[i]
    const newLine = newLines[i]
    
    if (oldLine === undefined) {
      diffLines.push({ type: 'added', content: newLine, lineNumber: i + 1 })
    } else if (newLine === undefined) {
      diffLines.push({ type: 'removed', content: oldLine, lineNumber: i + 1 })
    } else if (oldLine === newLine) {
      diffLines.push({ type: 'unchanged', content: oldLine, lineNumber: i + 1 })
    } else {
      diffLines.push({ type: 'removed', content: oldLine, lineNumber: i + 1 })
      diffLines.push({ type: 'added', content: newLine, lineNumber: i + 1 })
    }
  }
  
  return diffLines
}

export function rollback(
  relativePath: string, 
  versionId: string, 
  reason: string, 
  userId: string
): ConfigVersion {
  ensureDirs()
  
  const version = queries.configVersions.findById.get(versionId) as ConfigVersion | undefined
  if (!version) {
    throw new Error('Version not found')
  }
  
  const backups = queries.backups.list.all(versionId) as Backup[]
  const backup = backups.find(b => b.status === 'completed')
  
  if (!backup || !backup.file_path || !fs.existsSync(backup.file_path)) {
    throw new Error('Backup file not found')
  }
  
  const filePath = path.join(CONFIG_DIR, relativePath)
  const currentContent = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : ''
  
  const backupContent = fs.readFileSync(backup.file_path, 'utf-8')
  
  const diff = getDiff(currentContent, backupContent)
  const additions = diff.filter(l => l.type === 'added').length
  const deletions = diff.filter(l => l.type === 'removed').length
  
  fs.writeFileSync(filePath, backupContent)
  
  createAuditLog({
    actor_id: userId,
    action: 'config_rollback',
    resource_type: 'config_file',
    resource_id: relativePath,
    before_ref: computeHash(currentContent).slice(0, 8),
    after_ref: computeHash(backupContent).slice(0, 8),
    diff_summary: `+${additions} -${deletions} lines`,
    reason,
    risk_level: 'high',
  })
  
  const newVersionId = uuidv4()
  queries.configVersions.create.run({
    id: newVersionId,
    version: `v${Date.now()}`,
    hash: computeHash(backupContent),
    file_path: relativePath,
    content: redactSensitive(backupContent),
    created_by: userId,
  })
  
  return queries.configVersions.findById.get(newVersionId) as ConfigVersion
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
  
  return { valid: errors.length === 0, errors }
}
