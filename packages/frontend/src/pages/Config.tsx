import { useState } from 'react'
import { Settings, FileCode, Eye, History } from 'lucide-react'

export default function Config() {
  const [viewMode, setViewMode] = useState<'basic' | 'expert'>('basic')

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
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-6">Basic Settings</h2>
          <div className="space-y-6">
            <ConfigField
              label="Model Provider"
              type="select"
              options={['OpenAI', 'Anthropic', 'Local']}
              defaultValue="OpenAI"
            />
            <ConfigField
              label="Model Name"
              type="text"
              defaultValue="gpt-4"
            />
            <ConfigField
              label="Budget Limit"
              type="number"
              defaultValue="100"
              suffix="USD/month"
            />
            <ConfigField
              label="Max Tokens per Request"
              type="number"
              defaultValue="4096"
            />
            <div className="pt-4 border-t border-slate-200">
              <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                Test Availability
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-800">Config Files</h2>
                <div className="flex gap-2">
                  <button className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                    <Eye size={16} />
                    Preview
                  </button>
                  <button className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                    <History size={16} />
                    History
                  </button>
                </div>
              </div>
              <ConfigFileTree />
            </div>
          </div>
          <div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-800 mb-4">Version Info</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Version</span>
                  <span className="font-mono text-slate-700">v1.2.3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Last Modified</span>
                  <span className="text-slate-700">2 hours ago</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Backup Status</span>
                  <span className="text-green-600">Valid</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ConfigField({ label, type, defaultValue, options, suffix }: {
  label: string
  type: 'text' | 'number' | 'select'
  defaultValue?: string | number
  options?: string[]
  suffix?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        {type === 'select' ? (
          <select className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
            {options?.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            defaultValue={defaultValue}
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        )}
        {suffix && <span className="text-sm text-slate-500">{suffix}</span>}
      </div>
    </div>
  )
}

function ConfigFileTree() {
  const files = [
    { name: 'SOUL', description: 'Core identity configuration' },
    { name: 'AGENTS', description: 'Subagent definitions' },
    { name: 'USER', description: 'User preferences' },
    { name: 'IDENTITY', description: 'System identity' },
    { name: 'HEARTBEAT', description: 'Scheduled tasks config' },
  ]

  return (
    <div className="space-y-2">
      {files.map((file) => (
        <div
          key={file.name}
          className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer"
        >
          <FileCode size={20} className="text-slate-400" />
          <div>
            <p className="font-medium text-slate-700">{file.name}</p>
            <p className="text-xs text-slate-500">{file.description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
