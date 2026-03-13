import { RefreshCw, FileText, Trash2, Download, Shield } from 'lucide-react'

export default function Ops() {
  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Ops</h1>
        <p className="text-slate-500 mt-1">遇到异常先别慌：一键体检、生成诊断报告，需要时再执行修复动作。</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <OpsCard
          icon={RefreshCw}
          title="Restart Gateway"
          description="重启 OpenClaw Gateway 服务"
          variant="warning"
        />
        <OpsCard
          icon={Shield}
          title="Self-Check"
          description="检查连通性、能力、授权、资源"
          variant="primary"
        />
        <OpsCard
          icon={FileText}
          title="Export Diagnostics"
          description="生成并下载诊断包（脱敏）"
          variant="default"
        />
        <OpsCard
          icon={Trash2}
          title="Cleanup"
          description="清理临时文件和缓存"
          variant="warning"
        />
        <OpsCard
          icon={Download}
          title="Check Updates"
          description="检查是否有可用更新"
          variant="default"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Safety Controls</h2>
        <div className="space-y-4">
          <SafetyToggle
            label="Dry Run Mode"
            description="预览变更而不实际执行"
            defaultChecked
          />
          <SafetyToggle
            label="Require Confirmation"
            description="执行危险操作前需要确认"
            defaultChecked
          />
          <SafetyToggle
            label="Audit Logging"
            description="记录所有操作到审计日志"
            defaultChecked
          />
        </div>
      </div>
    </div>
  )
}

function OpsCard({
  icon: Icon,
  title,
  description,
  variant
}: {
  icon: React.ComponentType<{ size?: number | string; className?: string }>
  title: string
  description: string
  variant: 'primary' | 'warning' | 'danger' | 'default'
}) {
  const variantStyles = {
    primary: 'border-primary-200 hover:bg-primary-50',
    warning: 'border-yellow-200 hover:bg-yellow-50',
    danger: 'border-red-200 hover:bg-red-50',
    default: 'border-slate-200 hover:bg-slate-50',
  }

  const iconStyles = {
    primary: 'text-primary-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600',
    default: 'text-slate-600',
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border-2 ${variantStyles[variant]} p-6 cursor-pointer transition-colors`}>
      <Icon className={iconStyles[variant]} size={24} />
      <h3 className="font-semibold text-slate-800 mt-3">{title}</h3>
      <p className="text-sm text-slate-500 mt-1">{description}</p>
    </div>
  )
}

function SafetyToggle({ label, description, defaultChecked }: {
  label: string
  description: string
  defaultChecked?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium text-slate-700">{label}</p>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" defaultChecked={defaultChecked} className="sr-only peer" />
        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
      </label>
    </div>
  )
}
