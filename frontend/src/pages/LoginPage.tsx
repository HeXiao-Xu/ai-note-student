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
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold text-center">登录</h2>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); clearError() }}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="your@email.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
        <input
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); clearError() }}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {loading ? '登录中...' : '登录'}
      </button>

      <p className="text-center text-sm text-gray-600">
        还没有账号？{' '}
        <Link to="/register" className="text-indigo-600 hover:underline">
          注册
        </Link>
      </p>
    </form>
  )
}
