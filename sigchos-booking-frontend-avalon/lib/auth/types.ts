export type UserRole = 'CLIENT' | 'SYSTEM_ADMIN' | 'ESTABLISHMENT_ADMIN'

export interface UserResponse {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
  ruc?: string | null
  birthDate: string
  role: UserRole
  active: boolean
  profileCompleted: boolean
  mustChangePassword: boolean
  hasPassword: boolean
}

export interface AuthResponse {
  token: string
  user: UserResponse
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  firstName: string
  lastName: string
  email: string
  password: string
  phone: string
  birthDate: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  newPassword: string
}
