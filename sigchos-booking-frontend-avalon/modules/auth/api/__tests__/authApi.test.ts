import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AxiosResponse } from 'axios'

// ─── Mock del módulo apiClient ────────────────────────────────────────────────
// Hacemos el mock ANTES de importar el módulo que lo usa.
vi.mock('@/lib/http/apiClient', () => ({
  apiClient: {
    post: vi.fn(),
  },
}))

import { apiClient } from '@/lib/http/apiClient'
import { login, register, forgotPassword, resetPassword, loginWithGoogle } from '../authApi'
import type { AuthResponse, LoginRequest, RegisterRequest, UserResponse } from '@/lib/auth/types'

const mockedPost = vi.mocked(apiClient.post)

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockAuthResponse: AuthResponse = {
  token: 'jwt-token-abc123',
  user: {
    id: 1,
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan@test.com',
    phone: '0999999999',
    role: 'CLIENT',
    active: true,
    profileCompleted: true,
    mustChangePassword: false,
    birthDate: '1995-05-15',
  },
}

const mockUserResponse: UserResponse = {
  id: 2,
  firstName: 'María',
  lastName: 'López',
  email: 'maria@test.com',
  phone: '0988888888',
  role: 'CLIENT',
  active: true,
  profileCompleted: false,
  mustChangePassword: false,
  birthDate: '2000-01-01',
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('authApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('login()', () => {
    it('Debe llamar a POST /auth/login y retornar AuthResponse', async () => {
      const payload: LoginRequest = { email: 'juan@test.com', password: 'Pass123!' }
      mockedPost.mockResolvedValueOnce({ data: mockAuthResponse } as AxiosResponse)

      const result = await login(payload)

      expect(mockedPost).toHaveBeenCalledWith('/auth/login', payload)
      expect(result).toEqual(mockAuthResponse)
      expect(result.token).toBe('jwt-token-abc123')
    })

    it('Debe propagar el error si axios lanza una excepción', async () => {
      const payload: LoginRequest = { email: 'bad@test.com', password: 'wrong' }
      mockedPost.mockRejectedValueOnce(new Error('Network Error'))

      await expect(login(payload)).rejects.toThrow('Network Error')
    })
  })

  describe('register()', () => {
    it('Debe llamar a POST /auth/register y retornar UserResponse', async () => {
      const payload: RegisterRequest = {
        firstName: 'María',
        lastName: 'López',
        email: 'maria@test.com',
        password: 'Pass123!',
        phone: '0988888888',
        birthDate: '2000-01-01',
      }
      mockedPost.mockResolvedValueOnce({ data: mockUserResponse } as AxiosResponse)

      const result = await register(payload)

      expect(mockedPost).toHaveBeenCalledWith('/auth/register', payload)
      expect(result.email).toBe('maria@test.com')
    })
  })

  describe('forgotPassword()', () => {
    it('Debe llamar a POST /auth/forgot-password sin retornar datos', async () => {
      mockedPost.mockResolvedValueOnce({ data: undefined } as AxiosResponse)

      await expect(forgotPassword({ email: 'test@test.com' })).resolves.toBeUndefined()
      expect(mockedPost).toHaveBeenCalledWith('/auth/forgot-password', { email: 'test@test.com' })
    })
  })

  describe('resetPassword()', () => {
    it('Debe llamar a POST /auth/reset-password sin retornar datos', async () => {
      mockedPost.mockResolvedValueOnce({ data: undefined } as AxiosResponse)

      await expect(resetPassword({ token: 'abc', newPassword: 'New1!' })).resolves.toBeUndefined()
      expect(mockedPost).toHaveBeenCalledWith('/auth/reset-password', { token: 'abc', newPassword: 'New1!' })
    })
  })

  describe('loginWithGoogle()', () => {
    it('Debe llamar a POST /auth/google con el idToken y retornar AuthResponse', async () => {
      mockedPost.mockResolvedValueOnce({ data: mockAuthResponse } as AxiosResponse)

      const result = await loginWithGoogle('google-id-token-xyz')

      expect(mockedPost).toHaveBeenCalledWith('/auth/google', { idToken: 'google-id-token-xyz' })
      expect(result.token).toBe('jwt-token-abc123')
    })
  })
})
