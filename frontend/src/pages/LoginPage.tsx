import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, loading, error, clearError } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login({ email, password })
      navigate('/notes')
    } catch {
      // error is set in store
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-100 font-serif">欢迎回来</h2>
        <p className="text-slate-500 text-sm mt-1">登录你的 AI Note 账号</p>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm p-3 rounded-lg animate-fade-in">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-400 mb-1.5">邮箱</label>
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); clearError() }}
          required
          className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 transition-colors text-sm"
          placeholder="your@email.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-400 mb-1.5">密码</label>
        <input
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); clearError() }}
          required
          className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 transition-colors text-sm"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 px-4 bg-teal-500 text-slate-950 font-semibold rounded-lg hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
      >
        {loading ? '登录中...' : '登 录'}
      </button>

      <p className="text-center text-sm text-slate-500">
        还没有账号？{' '}
        <Link to="/register" className="text-teal-400 hover:text-teal-300 transition-colors">
          注册
        </Link>
      </p>
    </form>
  )
}
