import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Command, ArrowRight, Terminal, Settings } from 'lucide-react'
import { useCommandPalette } from '../hooks/useCommandPalette'

const categoryIcons: Record<string, React.ReactNode> = {
  '导航': <ArrowRight size={14} />,
  '运维': <Terminal size={14} />,
  '配置': <Settings size={14} />,
  '快捷': <Command size={14} />,
}

const categoryColors: Record<string, string> = {
  '导航': 'text-blue-500',
  '运维': 'text-orange-500',
  '配置': 'text-purple-500',
  '快捷': 'text-green-500',
}

export default function CommandPalette() {
  const navigate = useNavigate()

  const commands = useMemo(() => [
    { id: 'home', label: '前往首页', category: '导航', shortcut: 'G H', action: () => navigate('/') },
    { id: 'connect', label: '前往连接管理', category: '导航', shortcut: 'G C', action: () => navigate('/connect') },
    { id: 'tasks', label: '前往任务管理', category: '导航', shortcut: 'G T', action: () => navigate('/tasks') },
    { id: 'ops', label: '前往运维中心', category: '导航', shortcut: 'G O', action: () => navigate('/ops') },
    { id: 'config', label: '前往配置中心', category: '导航', shortcut: 'G F', action: () => navigate('/config') },
    { id: 'memory', label: '前往记忆管理', category: '导航', shortcut: 'G M', action: () => navigate('/memory') },
    { id: 'security', label: '前往安全中心', category: '导航', shortcut: 'G S', action: () => navigate('/security') },
    { id: 'self-check', label: '运行自检', category: '运维', action: () => { alert('执行自检') } },
    { id: 'diagnostics', label: '导出诊断包', category: '运维', action: () => { alert('导出诊断包') } },
    { id: 'restart', label: '重启 Gateway', category: '运维', action: () => { alert('重启 Gateway') } },
    { id: 'cleanup', label: '执行清理', category: '运维', action: () => { alert('执行清理') } },
    { id: 'backup', label: '立即备份', category: '配置', action: () => { alert('立即备份') } },
    { id: 'history', label: '查看配置历史', category: '配置', action: () => navigate('/config') },
    { id: 'search-memory', label: '搜索记忆', category: '快捷', action: () => navigate('/memory') },
    { id: 'audit-log', label: '查看审计日志', category: '快捷', action: () => navigate('/security') },
  ], [navigate])

  const {
    isOpen,
    close,
    search,
    setSearch,
    selectedIndex,
    setSelectedIndex,
    filteredCommands,
  } = useCommandPalette(commands)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'g' && !isOpen) {
        const handler = (e2: KeyboardEvent) => {
          const routes: Record<string, string> = {
            h: '/', c: '/connect', t: '/tasks', o: '/ops', f: '/config', m: '/memory', s: '/security'
          }
          if (routes[e2.key.toLowerCase()]) {
            navigate(routes[e2.key.toLowerCase()])
          }
        }
        window.addEventListener('keydown', handler, { once: true })
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, navigate])

  if (!isOpen) return null

  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = []
    acc[cmd.category].push(cmd)
    return acc
  }, {} as Record<string, typeof commands>)

  return (
    <div className="fixed inset-0 z-50" onClick={close}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      <div 
        className="absolute top-[20%] left-1/2 -translate-x-1/2 w-full max-w-xl bg-white rounded-xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
          <Search className="text-slate-400" size={20} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索命令..."
            className="flex-1 outline-none text-slate-800 placeholder:text-slate-400"
            autoFocus
          />
          <kbd className="px-2 py-1 text-xs text-slate-500 bg-slate-100 rounded">ESC</kbd>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {Object.entries(groupedCommands).map(([category, cmds]) => (
            <div key={category}>
              <div className="px-4 py-2 text-xs font-medium text-slate-500 bg-slate-50 flex items-center gap-2">
                <span className={categoryColors[category]}>{categoryIcons[category]}</span>
                {category}
              </div>
              {cmds.map((cmd) => {
          const globalIndex = filteredCommands.indexOf(cmd)
          return (
            <button
              key={cmd.id}
              className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                globalIndex === selectedIndex
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
              onClick={() => {
                cmd.action()
                close()
              }}
              onMouseEnter={() => setSelectedIndex(globalIndex)}
            >
              <span className="flex-1">{cmd.label}</span>
              {cmd.shortcut && (
                <kbd className="px-2 py-0.5 text-xs text-slate-500 bg-slate-100 rounded">
                  {cmd.shortcut}
                </kbd>
              )}
            </button>
          )
        })}
            </div>
          ))}

          {filteredCommands.length === 0 && (
            <div className="px-4 py-8 text-center text-slate-500">
              没有找到匹配的命令
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 px-4 py-2 border-t border-slate-200 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-100 rounded">↑↓</kbd> 选择
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-100 rounded">Enter</kbd> 执行
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-100 rounded">G</kbd> + <kbd className="px-1.5 py-0.5 bg-slate-100 rounded">H/C/T...</kbd> 快速导航
          </span>
        </div>
      </div>
    </div>
  )
}
