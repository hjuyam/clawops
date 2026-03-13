import { useState } from 'react'
import { Settings, FileCode, History, Loader2 } from 'lucide-react'
import ConfigEditor from '../components/ConfigEditor'
import { useConfigFiles, useConfigFile, useConfigVersions, useSaveConfig, useBackupConfig, useRollbackConfig } from '../utils/useConfig'
import { formatDate } from '../utils/helpers'

export default function Config() {
  const [viewMode, setViewMode] = useState<'basic' | 'expert'>('basic')
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [showVersions, setShowVersions] = useState(false)
  const [reason, setReason] = useState('')
  const [showReasonModal, setShowReasonModal] = useState(false)
  const [pendingRollback, setPendingRollback] = useState<{ versionId: string; version: string } | null>(null)

  const { data: configFiles, isLoading: loadingFiles } = useConfigFiles()
  const { data: fileData, isLoading: loadingFile } = useConfigFile(selectedFile || '')
  const { data: versions } = useConfigVersions(selectedFile || '')
  
  const saveMutation = useSaveConfig()
  const backupMutation = useBackupConfig()
  const rollbackMutation = useRollbackConfig()

  const handleSave = async (content: string, reasonText: string) => {
    if (!selectedFile) return
    
    await saveMutation.mutateAsync({
      path: selectedFile,
      content,
      reason: reasonText,
    })
  }

  const handleRollback = (versionId: string, version: string) => {
    setPendingRollback({ versionId, version })
    setShowReasonModal(true)
  }

  const confirmRollback = async () => {
    if (!selectedFile || !pendingRollback) return
    
    await rollbackMutation.mutateAsync({
      path: selectedFile,
      versionId: pendingRollback.versionId,
      reason: reason,
    })
    
    setShowReasonModal(false)
    setPendingRollback(null)
    setReason('')
  }

  const handleBackup = async () => {
    if (!selectedFile) return
    await backupMutation.mutateAsync({ path: selectedFile })
  }

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Config</h1>
        <p className="text-slate-500 mt-1">这里是专家区：改之前会自动备份，改之后可对比 diff 并随时回滚。</p>
      </header>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setViewMode('basic')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            viewMode === 'basic'
              ? 'bg-primary-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Settings size={18} className="inline mr-2" />
          Basic Settings
        </button>
        <button
          onClick={() => setViewMode('expert')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            viewMode === 'expert'
              ? 'bg-primary-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <FileCode size={18} className="inline mr-2" />
          Config Center (Expert)
        </button>
      </div>

      {viewMode === 'basic' ? (
        <BasicSettings />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <h2 className="font-semibold text-slate-800 mb-4">配置文件</h2>
              {loadingFiles ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="animate-spin text-slate-400" />
                </div>
              ) : (
                <div className="space-y-2">
                  {configFiles?.data?.map((file) => (
                    <button
                      key={file.path}
                      onClick={() => setSelectedFile(file.path)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedFile === file.path
                          ? 'bg-primary-50 border border-primary-200'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <FileCode size={18} className="text-slate-400" />
                        <div>
                          <p className="font-medium text-slate-700">{file.name}</p>
                          <p className="text-xs text-slate-500">{file.description}</p>
                        </div>
                      </div>
                      {file.exists && file.version && (
                        <p className="text-xs text-primary-600 mt-1 ml-7">{file.version}</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-3">
            {selectedFile ? (
              loadingFile ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 flex justify-center">
                  <Loader2 className="animate-spin text-slate-400" size={32} />
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <div className="flex items-center gap-4">
                      <h3 className="font-semibold text-slate-800">
                        {configFiles?.data?.find(f => f.path === selectedFile)?.name}
                      </h3>
                      <button
                        onClick={() => setShowVersions(!showVersions)}
                        className="flex items-center gap-1 px-3 py-1 text-sm text-slate-600 hover:bg-slate-100 rounded"
                      >
                        <History size={16} />
                        版本历史
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleBackup}
                        disabled={backupMutation.isPending}
                        className="px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 rounded"
                      >
                        {backupMutation.isPending ? '备份中...' : '备份'}
                      </button>
                    </div>
                  </div>

                  {showVersions && versions?.data ? (
                    <div className="p-4 border-b border-slate-200 max-h-60 overflow-y-auto">
                      <h4 className="text-sm font-medium text-slate-700 mb-2">版本历史</h4>
                      <div className="space-y-2">
                        {versions.data.map((v) => (
                          <div
                            key={v.id}
                            className="flex items-center justify-between p-2 bg-slate-50 rounded"
                          >
                            <div>
                              <p className="text-sm font-mono text-slate-600">{v.version}</p>
                              <p className="text-xs text-slate-500">{formatDate(v.created_at)}</p>
                            </div>
                            <button
                              onClick={() => handleRollback(v.id, v.version)}
                              className="text-xs text-primary-600 hover:underline"
                            >
                              回滚
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <ConfigEditor
                    filePath={selectedFile}
                    content={fileData?.data?.content || ''}
                    onSave={handleSave}
                    onCancel={() => setSelectedFile(null)}
                    version={fileData?.data?.version || undefined}
                  />
                </div>
              )
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center text-slate-500">
                <FileCode size={48} className="mx-auto mb-4 text-slate-300" />
                <p>选择左侧配置文件开始编辑</p>
              </div>
            )}
          </div>
        </div>
      )}

      {showReasonModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">回滚确认</h3>
            <p className="text-sm text-slate-600 mb-4">
              您即将回滚到版本 {pendingRollback?.version}。请提供回滚原因：
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg"
              rows={3}
              placeholder="回滚原因..."
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowReasonModal(false)
                  setPendingRollback(null)
                }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={confirmRollback}
                disabled={!reason.trim() || rollbackMutation.isPending}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50"
              >
                {rollbackMutation.isPending ? '回滚中...' : '确认回滚'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function BasicSettings() {
  const [settings, setSettings] = useState({
    model_provider: 'openai',
    model_name: 'gpt-4',
    budget_limit: 100,
    max_tokens: 4096,
  })

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-6">Basic Settings</h2>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Model Provider</label>
          <select
            value={settings.model_provider}
            onChange={(e) => setSettings({ ...settings, model_provider: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="local">Local</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Model Name</label>
          <input
            type="text"
            value={settings.model_name}
            onChange={(e) => setSettings({ ...settings, model_name: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Budget Limit (USD/month)
          </label>
          <input
            type="number"
            value={settings.budget_limit}
            onChange={(e) => setSettings({ ...settings, budget_limit: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Max Tokens per Request</label>
          <input
            type="number"
            value={settings.max_tokens}
            onChange={(e) => setSettings({ ...settings, max_tokens: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="pt-4 border-t border-slate-200">
          <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            Test Availability
          </button>
        </div>
      </div>
    </div>
  )
}
