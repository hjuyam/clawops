import { useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { 
  Home, 
  Link2, 
  ListTodo, 
  Settings, 
  Brain, 
  Shield,
  Terminal,
  LogOut,
  User,
  Command
} from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useState } from 'react'

const navItems = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/connect', label: 'Connect', icon: Link2 },
  { to: '/tasks', label: 'Tasks & Runs', icon: ListTodo },
  { to: '/ops', label: 'Ops', icon: Terminal },
  { to: '/config', label: 'Config', icon: Settings },
  { to: '/memory', label: 'Memory', icon: Brain },
  { to: '/security', label: 'Security', icon: Shield },
]

export default function Layout() {
  const navigate = useNavigate()
  const { user, isAuthenticated, checkAuth, logout } = useAuthStore()
  const [showUserMenu, setShowUserMenu] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (!isAuthenticated && useAuthStore.getState().initialized) {
      navigate('/login')
    }
  }, [isAuthenticated, navigate])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

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
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm text-slate-400">在线</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Command size={12} />
              <span>K</span>
            </div>
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
                <User size={16} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium truncate">{user?.username || 'User'}</p>
                <p className="text-xs text-slate-400">{user?.role || 'viewer'}</p>
              </div>
            </button>
            
            {showUserMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-slate-800 rounded-lg shadow-lg overflow-hidden">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700"
                >
                  <LogOut size={16} />
                  退出登录
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-slate-50">
        <Outlet />
      </main>
    </div>
  )
}
