'use client'

import { useRouter } from 'next/navigation'
import { useEffect, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import type { UserRole } from './types'

interface GuardProps {
  children: ReactNode
  redirectTo: string
}

interface RoleGuardProps extends GuardProps {
  allowedRoles: UserRole[]
}

/**
 * Only allows authenticated users. Redirects to `redirectTo` if not authenticated.
 */
export function ProtectedRoute({ children, redirectTo }: GuardProps) {
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(redirectTo)
    }
  }, [isAuthenticated, redirectTo, router])

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}

/**
 * Only allows unauthenticated users (login, register, etc.). Redirects to `redirectTo` if already authenticated.
 */
export function PublicOnlyRoute({ children, redirectTo }: GuardProps) {
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(redirectTo)
    }
  }, [isAuthenticated, redirectTo, router])

  if (isAuthenticated) {
    return null
  }

  return <>{children}</>
}

/**
 * Only allows users with specific roles. Redirects to `redirectTo` if role not allowed.
 */
export function RoleProtectedRoute({ children, redirectTo, allowedRoles }: RoleGuardProps) {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user || !allowedRoles.includes(user.role)) {
      router.replace(redirectTo)
    }
  }, [user, allowedRoles, redirectTo, router])

  if (!user || !allowedRoles.includes(user.role)) {
    return null
  }

  return <>{children}</>
}

/**
 * Redirects ESTABLISHMENT_ADMIN users to onboarding if profile is not completed or must change password.
 */
export function EstablishmentAdminOnboardingGuard({ children, redirectTo }: GuardProps) {
  const { user } = useAuth()
  const router = useRouter()

  const needsOnboarding =
    user?.role === 'ESTABLISHMENT_ADMIN' &&
    (!user.profileCompleted || user.mustChangePassword)

  useEffect(() => {
    if (needsOnboarding) {
      router.replace(redirectTo)
    }
  }, [needsOnboarding, redirectTo, router])

  if (needsOnboarding) {
    return null
  }

  return <>{children}</>
}

