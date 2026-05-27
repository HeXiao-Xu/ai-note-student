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
    if (password !== confirmPassword) {
      return
    }
    try {
      await register({ username, email, password })
      navigate('/notes')
    } catch {
      // error is set in store
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold text-center">注册</h2>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
        <input
          type="text"
          value={username}
          onChange={(e) => { setUsername(e.target.value); clearError() }}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="your_username"
        />
      </div>

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
          minLength={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="••••••••"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">确认密码</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => { setConfirmPassword(e.target.value); clearError() }}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="••••••••"
        />
        {confirmPassword && password !== confirmPassword && (
          <p className="text-red-500 text-xs mt-1">两次输入的密码不一致</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading || password !== confirmPassword}
        className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {loading ? '注册中...' : '注册'}
      </button>

      <p className="text-center text-sm text-gray-600">
        已有账号？{' '}
        <Link to="/login" className="text-indigo-600 hover:underline">
          登录
        </Link>
      </p>
    </form>
  )
}
