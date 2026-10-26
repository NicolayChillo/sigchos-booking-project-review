import { apiClient } from '@/lib/http/apiClient'
import type {
  AuthResponse,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  UserResponse,
} from '@/lib/auth/types'

export async function login(payload: LoginRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/login', payload)
  return response.data
}

export async function register(payload: RegisterRequest): Promise<UserResponse> {
  const response = await apiClient.post<UserResponse>('/auth/register', payload)
  return response.data
}

export async function forgotPassword(payload: ForgotPasswordRequest): Promise<void> {
  await apiClient.post('/auth/forgot-password', payload)
}

export async function resetPassword(payload: ResetPasswordRequest): Promise<void> {
  await apiClient.post('/auth/reset-password', payload)
}

export async function loginWithGoogle(idToken: string): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/google', { idToken })
  return response.data
}
