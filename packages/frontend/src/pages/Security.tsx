import { Shield, AlertTriangle, CheckCircle, Lock, Eye, FileText } from 'lucide-react'

export default function Security() {
  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Security & Audit</h1>
        <p className="text-slate-500 mt-1">默认更安全：开启必要防护后，再考虑远程访问与外发能力。</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <SecurityScoreCard score={85} status="good" />
        <SecurityCheckCard title="Authentication" checks={['TOTP Enabled', 'Session Management']} passed={2} total={2} />
        <SecurityCheckCard title="Access Control" checks={['RBAC Configured', 'Audit Logging']} passed={2} total={2} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Security Settings</h2>
          <div className="space-y-4">
            <SecurityToggle label="Two-Factor Authentication" enabled={true} />
            <SecurityToggle label="Session Expiry" enabled={true} />
            <SecurityToggle label="SSRF Protection" enabled={true} />
            <SecurityToggle label="Safe Mode" enabled={false} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <ActionButton icon={Lock} label="Manage Sessions" />
            <ActionButton icon={Eye} label="View Audit Log" />
            <ActionButton icon={Shield} label="Security Scan" />
            <ActionButton icon={FileText} label="Export Report" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Audit Log</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Action</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Resource</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {auditLogs.map((log, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-600">{log.time}</td>
                  <td className="px-4 py-3 text-sm text-slate-800">{log.action}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{log.actor}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{log.resource}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs rounded ${
                      log.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const auditLogs = [
  { time: '10:30:15', action: 'config_change', actor: 'admin', resource: 'model.yaml', status: 'success' },
  { time: '10:25:00', action: 'login', actor: 'admin', resource: 'session', status: 'success' },
  { time: '10:20:00', action: 'backup_create', actor: 'system', resource: 'config', status: 'success' },
  { time: '10:15:00', action: 'tool_call', actor: 'agent', resource: 'external_api', status: 'success' },
]

function SecurityScoreCard({ score, status }: { score: number; status: 'good' | 'warning' | 'danger' }) {
  const statusConfig = {
    good: { color: 'text-green-500', bg: 'bg-green-100', icon: CheckCircle },
    warning: { color: 'text-yellow-500', bg: 'bg-yellow-100', icon: AlertTriangle },
    danger: { color: 'text-red-500', bg: 'bg-red-100', icon: AlertTriangle },
  }
  const config = statusConfig[status]

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <config.icon className={config.color} size={24} />
        <h3 className="font-semibold text-slate-800">Security Score</h3>
      </div>
      <p className={`text-4xl font-bold ${config.color}`}>{score}</p>
      <p className="text-sm text-slate-500 mt-1">out of 100</p>
    </div>
  )
}

function SecurityCheckCard({ title, checks, passed, total }: {
  title: string
  checks: string[]
  passed: number
  total: number
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="font-semibold text-slate-800 mb-3">{title}</h3>
      <div className="space-y-2">
        {checks.map((check) => (
          <div key={check} className="flex items-center gap-2">
            <CheckCircle size={16} className="text-green-500" />
            <span className="text-sm text-slate-600">{check}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500 mt-3">{passed}/{total} checks passed</p>
    </div>
  )
}

function SecurityToggle({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-700">{label}</span>
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" defaultChecked={enabled} className="sr-only peer" />
        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
      </label>
    </div>
  )
}

function ActionButton({ icon: Icon, label }: {
  icon: React.ComponentType<{ size?: number | string; className?: string }>
  label: string
}) {
  return (
    <button className="flex items-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors">
      <Icon size={18} />
      <span className="text-sm font-medium">{label}</span>
    </button>
  )
}
