import { NavLink, Outlet } from 'react-router-dom'
import { 
  Home, 
  Link, 
  ListTodo, 
  Settings, 
  Brain, 
  Shield,
  Terminal
} from 'lucide-react'

const navItems = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/connect', label: 'Connect', icon: Link },
  { to: '/tasks', label: 'Tasks & Runs', icon: ListTodo },
  { to: '/ops', label: 'Ops', icon: Terminal },
  { to: '/config', label: 'Config', icon: Settings },
  { to: '/memory', label: 'Memory', icon: Brain },
  { to: '/security', label: 'Security', icon: Shield },
]

export default function Layout() {
  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <h1 className="text-xl font-bold">🦞 ClawOps</h1>
          <p className="text-sm text-slate-400">龙虾管家</p>
        </div>
        
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`
                  }
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm text-slate-400">Connected</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
