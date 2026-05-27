export interface User {
  id: number
  username: string
  email: string
  avatar: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface ApiResponse<T> {
  data: T
  error?: string
}
