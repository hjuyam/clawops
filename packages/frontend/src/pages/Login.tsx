import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, User, KeyRound, Shield, AlertCircle, Loader2 } from 'lucide-react'
import axios from 'axios'

interface LoginFormData {
  username: string
  password: string
  totp_code: string
  remember_device: boolean
}

export default function Login() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: '',
    totp_code: '',
    remember_device: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [requiresTotp, setRequiresTotp] = useState(false)
  const totpInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (requiresTotp && totpInputRef.current) {
      totpInputRef.current.focus()
    }
  }, [requiresTotp])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await axios.post('/api/auth/login', {
        username: formData.username,
        password: formData.password,
        totp_code: formData.totp_code || undefined,
        remember_device: formData.remember_device,
      })

      if (response.data.requires_totp) {
        setRequiresTotp(true)
        setLoading(false)
        return
      }

      if (response.data.success) {
        navigate('/')
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error)
      } else {
        setError('An unexpected error occurred')
      }
      setLoading(false)
    }
  }, [formData, navigate])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-500 mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">ClawOps</h1>
          <p className="text-slate-400 mt-2">龙虾管家 · 安全登录</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {!requiresTotp ? (
              <>
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-2">
                    用户名
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      value={formData.username}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                      placeholder="请输入用户名"
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                    密码
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                      placeholder="请输入密码"
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    id="remember_device"
                    name="remember_device"
                    type="checkbox"
                    checked={formData.remember_device}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="remember_device" className="ml-2 text-sm text-slate-600">
                    记住此设备（7天内免登录）
                  </label>
                </div>
              </>
            ) : (
              <div>
                <label htmlFor="totp_code" className="block text-sm font-medium text-slate-700 mb-2">
                  双因素验证码
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    ref={totpInputRef}
                    id="totp_code"
                    name="totp_code"
                    type="text"
                    required
                    maxLength={6}
                    value={formData.totp_code}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow text-center text-2xl tracking-widest"
                    placeholder="000000"
                    pattern="[0-9]{6}"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                  />
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  请输入认证器应用中的6位数字验证码
                </p>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="text-red-500" size={18} />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  验证中...
                </>
              ) : requiresTotp ? (
                '验证'
              ) : (
                '登录'
              )}
            </button>
          </form>

          {!requiresTotp && (
            <div className="mt-6 text-center">
              <button 
                type="button"
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                忘记密码？
              </button>
            </div>
          )}

          {requiresTotp && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setRequiresTotp(false)
                  setFormData(prev => ({ ...prev, totp_code: '' }))
                  setError(null)
                }}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                返回重新登录
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            默认账户：admin / admin123（首次登录后请立即修改密码）
          </p>
        </div>
      </div>
    </div>
  )
}
