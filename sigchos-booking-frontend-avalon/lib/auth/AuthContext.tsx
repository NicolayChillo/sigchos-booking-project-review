'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { clearAuthToken, getAuthToken, setAuthToken } from '../http/tokenStorage'
import type { AuthResponse, UserResponse } from './types'

const AUTH_USER_STORAGE_KEY = 'sigchos.booking.user'

interface AuthContextValue {
  token: string | null
  user: UserResponse | null
  isAuthenticated: boolean
  signIn: (auth: AuthResponse) => void
  signOut: () => void
  updateUser: (user: UserResponse) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function readStoredUser(): UserResponse | null {
  if (typeof window === 'undefined') return null

  const rawUser = localStorage.getItem(AUTH_USER_STORAGE_KEY)

  if (!rawUser) {
    return null
  }

  try {
    return JSON.parse(rawUser) as UserResponse
  } catch {
    localStorage.removeItem(AUTH_USER_STORAGE_KEY)
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getAuthToken())
  const [user, setUser] = useState<UserResponse | null>(() => readStoredUser())

  const signIn = useCallback((auth: AuthResponse) => {
    setAuthToken(auth.token)
    localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(auth.user))

    setToken(auth.token)
    setUser(auth.user)
  }, [])

  const signOut = useCallback(() => {
    clearAuthToken()
    localStorage.removeItem(AUTH_USER_STORAGE_KEY)

    setToken(null)
    setUser(null)
  }, [])

  const updateUser = useCallback((updatedUser: UserResponse) => {
    localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(updatedUser))
    setUser(updatedUser)
  }, [])

  useEffect(() => {
    const onUnauthorized = () => {
      signOut()
    }

    window.addEventListener('auth:unauthorized', onUnauthorized)

    return () => {
      window.removeEventListener('auth:unauthorized', onUnauthorized)
    }
  }, [signOut])

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      signIn,
      signOut,
      updateUser,
    }),
    [signIn, signOut, token, updateUser, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
