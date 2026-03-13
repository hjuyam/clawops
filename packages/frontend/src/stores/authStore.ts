import { create } from 'zustand'
import api from '../utils/api'

interface User {
  id: string
  username: string
  role: 'admin' | 'operator' | 'viewer'
  totp_enabled?: boolean
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  initialized: boolean
  
  login: (username: string, password: string, totpCode?: string) => Promise<{ success: boolean; requiresTotp?: boolean; error?: string }>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  setUser: (user: User | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  loading: false,
  initialized: false,
  
  login: async (username: string, password: string, totpCode?: string) => {
    set({ loading: true })
    
    try {
      const response = await api.post('/api/auth/login', {
        username,
        password,
        totp_code: totpCode,
      })
      
      const data = response.data as { success: boolean; data?: { user: User }; requires_totp?: boolean }
      
      if (data.requires_totp) {
        set({ loading: false })
        return { success: false, requiresTotp: true }
      }
      
      if (data.success && data.data?.user) {
        set({ 
          user: data.data.user, 
          isAuthenticated: true, 
          loading: false 
        })
        return { success: true }
      }
      
      set({ loading: false })
      return { success: false, error: '登录失败' }
    } catch (error) {
      set({ loading: false })
      const message = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || '登录失败'
      return { success: false, error: message }
    }
  },
  
  logout: async () => {
    try {
      await api.post('/api/auth/logout')
    } catch {
      // Ignore logout errors
    }
    
    set({ user: null, isAuthenticated: false })
  },
  
  checkAuth: async () => {
    set({ loading: true })
    
    try {
      const response = await api.get('/api/auth/me')
      const data = response.data as { success: boolean; data?: User }
      
      if (data.success && data.data) {
        set({ 
          user: data.data, 
          isAuthenticated: true, 
          loading: false,
          initialized: true 
        })
      } else {
        set({ 
          user: null, 
          isAuthenticated: false, 
          loading: false,
          initialized: true 
        })
      }
    } catch {
      set({ 
        user: null, 
        isAuthenticated: false, 
        loading: false,
        initialized: true 
      })
    }
  },
  
  setUser: (user) => {
    set({ user, isAuthenticated: !!user })
  },
}))
