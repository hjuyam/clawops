import { Activity, AlertCircle, CheckCircle } from 'lucide-react'

export default function Home() {
  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Home</h1>
        <p className="text-slate-500 mt-1">从这里开始：先确认环境正常，再逐步开启高级能力。</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatusCard
          title="Gateway Status"
          status="healthy"
          message="All services running normally"
        />
        <StatusCard
          title="Connection"
          status="healthy"
          message="Connected to localhost"
        />
        <StatusCard
          title="Last Check"
          status="warning"
          message="Self-check pending (15 min ago)"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ActionButton label="Run Self-Check" />
          <ActionButton label="Export Diagnostics" />
          <ActionButton label="Backup Now" />
          <ActionButton label="View Logs" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          <ActivityItem
            time="2 minutes ago"
            action="Config updated"
            details="model.yaml - provider settings changed"
          />
          <ActivityItem
            time="15 minutes ago"
            action="Task completed"
            details="self-check completed successfully"
          />
          <ActivityItem
            time="1 hour ago"
            action="Backup created"
            details="Automatic backup before config change"
          />
        </div>
      </div>
    </div>
  )
}

function StatusCard({ title, status, message }: { 
  title: string
  status: 'healthy' | 'warning' | 'error'
  message: string 
}) {
  const statusConfig = {
    healthy: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' },
    warning: { icon: AlertCircle, color: 'text-yellow-500', bg: 'bg-yellow-50' },
    error: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${config.bg}`}>
          <Icon className={config.color} size={20} />
        </div>
        <h3 className="font-medium text-slate-800">{title}</h3>
      </div>
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  )
}

function ActionButton({ label }: { label: string }) {
  return (
    <button className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors">
      <Activity size={18} />
      <span className="text-sm font-medium">{label}</span>
    </button>
  )
}

function ActivityItem({ time, action, details }: { 
  time: string
  action: string
  details: string 
}) {
  return (
    <div className="flex items-start gap-4 py-2">
      <span className="text-xs text-slate-400 w-24 shrink-0">{time}</span>
      <div>
        <p className="text-sm font-medium text-slate-700">{action}</p>
        <p className="text-xs text-slate-500">{details}</p>
      </div>
    </div>
  )
}
