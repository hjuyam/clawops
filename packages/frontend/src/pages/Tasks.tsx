import { Play, Square, Clock, ChevronRight } from 'lucide-react'

export default function Tasks() {
  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Tasks & Runs</h1>
        <p className="text-slate-500 mt-1">统一 Runs/Tasks 入口，查看运行历史与单次运行详情。</p>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">New Run</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Task ID</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter task ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Workflow ID</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter workflow ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Parameters</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="JSON parameters"
            />
          </div>
        </div>
        <div className="mt-4">
          <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            <Play size={18} />
            Start Run
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Run History</h2>
        </div>
        <div className="divide-y divide-slate-200">
          {mockRuns.map((run) => (
            <RunItem key={run.id} run={run} />
          ))}
        </div>
      </div>
    </div>
  )
}

const mockRuns = [
  { id: 'run_001', task: 'self-check', status: 'completed', duration: '2m 15s', time: '10 min ago' },
  { id: 'run_002', task: 'diagnostics', status: 'completed', duration: '1m 45s', time: '1 hour ago' },
  { id: 'run_003', task: 'cleanup', status: 'running', duration: '0m 30s', time: 'Now' },
  { id: 'run_004', task: 'backup', status: 'failed', duration: '0m 10s', time: '2 hours ago' },
]

function RunItem({ run }: { run: typeof mockRuns[0] }) {
  const statusColors = {
    completed: 'bg-green-100 text-green-700',
    running: 'bg-blue-100 text-blue-700',
    failed: 'bg-red-100 text-red-700',
    pending: 'bg-slate-100 text-slate-700',
  }

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-slate-50 cursor-pointer">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm text-slate-600">{run.id}</span>
          <span className={`px-2 py-0.5 text-xs rounded ${statusColors[run.status]}`}>
            {run.status}
          </span>
        </div>
        <p className="text-sm text-slate-500 mt-1">{run.task}</p>
      </div>
      <div className="text-right">
        <p className="text-sm text-slate-600">{run.duration}</p>
        <p className="text-xs text-slate-400">{run.time}</p>
      </div>
      <ChevronRight className="text-slate-400" size={20} />
    </div>
  )
}
