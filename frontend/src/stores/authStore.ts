import { create } from 'zustand'
import type { User } from '../types/auth'
import { login as apiLogin, register as apiRegister } from '../api/auth'
import type { LoginRequest, RegisterRequest } from '../types/auth'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null

  login: (data: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => void
  clearError: () => void
  initAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,

  login: async (data) => {
    set({ loading: true, error: null })
    try {
      const tokenRes = await apiLogin(data)
      localStorage.setItem('access_token', tokenRes.access_token)
      // Decode JWT to get user info (base64 payload)
      const payload = JSON.parse(atob(tokenRes.access_token.split('.')[1]))
      const user: User = {
        id: payload.user_id,
        username: payload.username,
        email: data.email,
        avatar: '',
      }
      set({ user, token: tokenRes.access_token, isAuthenticated: true, loading: false })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '登录失败'
      set({ error: message, loading: false })
      throw err
    }
  },

  register: async (data) => {
    set({ loading: true, error: null })
    try {
      await apiRegister(data)
      // After register, auto-login
      await useAuthStore.getState().login({ email: data.email, password: data.password })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '注册失败'
      set({ error: message, loading: false })
      throw err
    }
  },

  logout: () => {
    localStorage.removeItem('access_token')
    set({ user: null, token: null, isAuthenticated: false, error: null })
  },

  clearError: () => set({ error: null }),

  initAuth: () => {
    const token = localStorage.getItem('access_token')
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        const user: User = {
          id: payload.user_id,
          username: payload.username,
          email: '',
          avatar: '',
        }
        set({ user, token, isAuthenticated: true })
      } catch {
        localStorage.removeItem('access_token')
        set({ user: null, token: null, isAuthenticated: false })
      }
    }
  },
}))
