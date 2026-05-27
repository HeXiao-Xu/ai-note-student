import client from './client'
import type { RegisterRequest, LoginRequest, TokenResponse, User } from '../types/auth'

export async function register(data: RegisterRequest): Promise<User> {
  const res = await client.post<User>('/auth/register', data)
  return res.data
}

export async function login(data: LoginRequest): Promise<TokenResponse> {
  const res = await client.post<TokenResponse>('/auth/login', data)
  return res.data
}

export async function refreshToken(): Promise<TokenResponse> {
  const res = await client.post<TokenResponse>('/auth/refresh')
  return res.data
}
