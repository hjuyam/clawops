import { Search, Trash2, Pin, Filter } from 'lucide-react'

export default function Memory() {
  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Memory</h1>
        <p className="text-slate-500 mt-1">把结果沉淀成长期记忆：可搜索、可整理、也可随时清理或导出。</p>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search memories..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option>All Sources</option>
            <option>Conversations</option>
            <option>Tasks</option>
            <option>Web</option>
            <option>Files</option>
          </select>
          <select className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option>All Time</option>
            <option>Today</option>
            <option>Yesterday</option>
            <option>Last 7 days</option>
            <option>Last 30 days</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Memories" value="1,234" />
        <StatCard label="Pinned" value="45" />
        <StatCard label="Size" value="12.5 MB" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Recent Memories</h2>
          <div className="flex gap-2">
            <button className="flex items-center gap-1 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
              <Filter size={16} />
              Filter
            </button>
          </div>
        </div>
        <div className="divide-y divide-slate-200">
          {mockMemories.map((memory) => (
            <MemoryItem key={memory.id} memory={memory} />
          ))}
        </div>
      </div>
    </div>
  )
}

const mockMemories = [
  { id: 'mem_001', title: 'API Integration Notes', source: 'conversation', time: '10 min ago', pinned: true },
  { id: 'mem_002', title: 'Debug Session - Auth Issue', source: 'task', time: '1 hour ago', pinned: false },
  { id: 'mem_003', title: 'Documentation Reference', source: 'web', time: '2 hours ago', pinned: false },
  { id: 'mem_004', title: 'Config Backup Settings', source: 'file', time: '1 day ago', pinned: true },
]

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-slate-800 mt-1">{value}</p>
    </div>
  )
}

function MemoryItem({ memory }: { memory: typeof mockMemories[0] }) {
  const sourceColors = {
    conversation: 'bg-blue-100 text-blue-700',
    task: 'bg-green-100 text-green-700',
    web: 'bg-purple-100 text-purple-700',
    file: 'bg-orange-100 text-orange-700',
  }

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-slate-50">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-slate-800">{memory.title}</p>
          {memory.pinned && <Pin size={14} className="text-yellow-500" />}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className={`px-2 py-0.5 text-xs rounded ${sourceColors[memory.source as keyof typeof sourceColors]}`}>
            {memory.source}
          </span>
          <span className="text-xs text-slate-400">{memory.time}</span>
        </div>
      </div>
      <div className="flex gap-2">
        <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
          <Pin size={18} />
        </button>
        <button className="p-2 text-slate-400 hover:text-red-600 transition-colors">
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  )
}
