import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const { register, loading, error, clearError } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) return
    try {
      await register({ username, email, password })
      navigate('/notes')
    } catch {
      // error is set in store
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">创建账号</h2>
        <p className="text-slate-500 text-sm mt-1">开始你的智能笔记之旅</p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm p-3 rounded-lg animate-fade-in">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">用户名</label>
        <input
          type="text"
          value={username}
          onChange={(e) => { setUsername(e.target.value); clearError() }}
          required
          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
          placeholder="your_username"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">邮箱</label>
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); clearError() }}
          required
          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
          placeholder="your@email.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">密码</label>
        <input
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); clearError() }}
          required
          minLength={6}
          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
          placeholder="至少6位"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">确认密码</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => { setConfirmPassword(e.target.value); clearError() }}
          required
          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
          placeholder="再次输入密码"
        />
        {confirmPassword && password !== confirmPassword && (
          <p className="text-rose-500 text-xs mt-1.5">两次输入的密码不一致</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading || password !== confirmPassword}
        className="w-full py-2.5 px-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
      >
        {loading ? '注册中...' : '注 册'}
      </button>

      <p className="text-center text-sm text-slate-500">
        已有账号？{' '}
        <Link to="/login" className="text-indigo-600 hover:text-indigo-500 font-medium transition-colors">
          登录
        </Link>
      </p>
    </form>
  )
}
