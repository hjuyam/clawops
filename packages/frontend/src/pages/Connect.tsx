import { Wifi, WifiOff, Server, Globe } from 'lucide-react'

export default function Connect() {
  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Connect</h1>
        <p className="text-slate-500 mt-1">管理本机、远程或反代域名连接，检测连通性与能力。</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ConnectionCard
          type="local"
          title="Local Gateway"
          url="http://localhost:8080"
          status="connected"
          capabilities={['SSE', 'Memory', 'Config Edit']}
        />
        <ConnectionCard
          type="remote"
          title="Remote Gateway"
          url="Not configured"
          status="disconnected"
          capabilities={[]}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Connection Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Gateway URL
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="http://localhost:8080"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Authentication Method
            </label>
            <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option>Session Cookie</option>
              <option>API Token</option>
              <option>TOTP</option>
            </select>
          </div>
          <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            Test Connection
          </button>
        </div>
      </div>
    </div>
  )
}

function ConnectionCard({ type, title, url, status, capabilities }: {
  type: 'local' | 'remote'
  title: string
  url: string
  status: 'connected' | 'disconnected' | 'error'
  capabilities: string[]
}) {
  const Icon = type === 'local' ? Server : Globe
  const StatusIcon = status === 'connected' ? Wifi : WifiOff
  const statusColor = status === 'connected' ? 'text-green-500' : 'text-slate-400'

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <Icon className="text-slate-400" size={24} />
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800">{title}</h3>
          <p className="text-sm text-slate-500">{url}</p>
        </div>
        <StatusIcon className={statusColor} size={20} />
      </div>

      {capabilities.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {capabilities.map((cap) => (
            <span key={cap} className="px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded">
              {cap}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
