import { useState, useEffect, useCallback, useRef } from 'react'

interface ConfigEditorProps {
  filePath: string
  content: string
  onSave: (content: string, reason: string) => Promise<void>
  onCancel: () => void
  readOnly?: boolean
  version?: string
}

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged'
  content: string
  lineNumber: number
}

export default function ConfigEditor({
  filePath,
  content: initialContent,
  onSave,
  onCancel,
  readOnly = false,
  version,
}: ConfigEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [showDiff, setShowDiff] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  const hasChanges = content !== initialContent
  
  const lines = content.split('\n')
  const originalLines = initialContent.split('\n')
  
  const diff: DiffLine[] = showDiff ? computeDiff(originalLines, lines) : []
  
  const handleSave = useCallback(async () => {
    if (!reason.trim()) return
    
    setSaving(true)
    try {
      await onSave(content, reason)
      setShowSaveModal(false)
      setReason('')
    } catch (error) {
      console.error('Save failed:', error)
    } finally {
      setSaving(false)
    }
  }, [content, reason, onSave])
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      if (hasChanges && !readOnly) {
        setShowSaveModal(true)
      }
    }
    
    if (e.key === 'Escape') {
      if (showSaveModal) {
        setShowSaveModal(false)
      } else if (hasChanges) {
        onCancel()
      }
    }
  }, [hasChanges, readOnly, showSaveModal, onCancel])
  
  useEffect(() => {
    setContent(initialContent)
  }, [initialContent])
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-sm">{filePath}</span>
          {version && (
            <span className="px-2 py-0.5 text-xs bg-slate-700 text-slate-300 rounded">
              {version}
            </span>
          )}
          {hasChanges && (
            <span className="text-yellow-400 text-sm">● 未保存</span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDiff(!showDiff)}
            className={`px-3 py-1 text-sm rounded ${
              showDiff 
                ? 'bg-primary-600 text-white' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Diff
          </button>
          
          {!readOnly && (
            <button
              onClick={() => setShowSaveModal(true)}
              disabled={!hasChanges}
              className="px-3 py-1 text-sm bg-primary-600 hover:bg-primary-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded"
            >
              保存
            </button>
          )}
          
          <button
            onClick={onCancel}
            className="px-3 py-1 text-sm bg-slate-700 hover:bg-slate-600 text-slate-300 rounded"
          >
            关闭
          </button>
        </div>
      </div>
      
        <div className="flex-1 overflow-auto bg-slate-900 font-mono text-sm">
          <div className="flex">
            <div className="flex-shrink-0 py-4 px-2 text-right text-slate-600 select-none border-r border-slate-700">
              {(showDiff ? diff : lines).map((line, i) => (
                <div key={i} className="leading-6">
                  {showDiff ? (line as DiffLine).lineNumber : i + 1}
                </div>
              ))}
            </div>
          
          <div className="flex-1 relative">
            {showDiff ? (
              <div className="py-4 px-4">
                {diff.map((line, i) => (
                  <div
                    key={i}
                    className={`leading-6 whitespace-pre ${
                      line.type === 'added'
                        ? 'bg-green-900/30 text-green-300'
                        : line.type === 'removed'
                        ? 'bg-red-900/30 text-red-300 line-through'
                        : 'text-slate-300'
                    }`}
                  >
                    {line.content || ' '}
                  </div>
                ))}
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                readOnly={readOnly}
                className="w-full h-full py-4 px-4 bg-transparent text-slate-100 outline-none resize-none leading-6"
                spellCheck={false}
              />
            )}
          </div>
        </div>
      </div>
      
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">保存配置</h3>
            <p className="text-sm text-slate-600 mb-4">
              请输入更改原因（用于审计日志）
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="例如：更新模型配置以支持新的 API"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              rows={3}
              autoFocus
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={!reason.trim() || saving}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 text-white rounded-lg"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function computeDiff(oldLines: string[], newLines: string[]): DiffLine[] {
  const result: DiffLine[] = []
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
