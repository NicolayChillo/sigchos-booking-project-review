'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useRouter, useSearchParams } from 'next/navigation'
import { z } from 'zod'
import { InputText } from 'primereact/inputtext'
import { Password } from 'primereact/password'
import { Button } from 'primereact/button'
import { Message } from 'primereact/message'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/AuthContext'
import { getLoginErrorMessage, getGoogleLoginErrorMessage } from '@/lib/http/getAuthErrorMessage'
import { login, loginWithGoogle } from '@/modules/auth/api/authApi'
import { AuthShell } from '@/modules/auth/components/AuthShell'
import { GoogleSignInButton } from '@/modules/auth/components/GoogleSignInButton'

const loginSchema = z.object({
  email: z.string().email('Ingresa un correo válido.'),
  password: z.string().min(1, 'Ingresa tu contraseña.'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn } = useAuth()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const fromRegister = searchParams.get('fromRegister') === 'true'
  const fromPasswordReset = searchParams.get('fromPasswordReset') === 'true'
  const registeredEmail = searchParams.get('email') || ''

  // Booking redirect params — passed when user clicks "login to book" from a room page
  const redirectTo = searchParams.get('redirectTo') ?? ''
  const redirectCheckIn = searchParams.get('checkInDate') ?? ''
  const redirectCheckOut = searchParams.get('checkOutDate') ?? ''

  // Only allow redirects to internal landing routes to prevent open redirect
  const safeRedirectTo = redirectTo.startsWith('/landing/') ? redirectTo : ''

  function buildBookingRedirectUrl() {
    if (!safeRedirectTo) return '/dashboard'
    const params = new URLSearchParams()
    if (redirectCheckIn) params.set('checkInDate', redirectCheckIn)
    if (redirectCheckOut) params.set('checkOutDate', redirectCheckOut)
    const qs = params.toString()
    return qs ? `${safeRedirectTo}?${qs}` : safeRedirectTo
  }

  // Build register link preserving booking context
  const registerHref = useMemo(() => {
    if (!safeRedirectTo) return '/auth/register'
    const params = new URLSearchParams()
    params.set('redirectTo', safeRedirectTo)
    if (redirectCheckIn) params.set('checkInDate', redirectCheckIn)
    if (redirectCheckOut) params.set('checkOutDate', redirectCheckOut)
    return `/auth/register?${params.toString()}`
  }, [safeRedirectTo, redirectCheckIn, redirectCheckOut])

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  useEffect(() => {
    if (registeredEmail) {
      setValue('email', registeredEmail)
    }
  }, [registeredEmail, setValue])

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (authData) => {
      signIn(authData)
      if (
        authData.user.role === 'ESTABLISHMENT_ADMIN' &&
        (!authData.user.profileCompleted || authData.user.mustChangePassword)
      ) {
        router.replace('/auth/onboarding')
        return
      }

      if (authData.user.role === 'CLIENT' && !authData.user.profileCompleted) {
        const profileUrl = safeRedirectTo
          ? `/profile?showCompleteProfileAlert=true&redirectTo=${encodeURIComponent(safeRedirectTo)}${redirectCheckIn ? `&checkInDate=${redirectCheckIn}` : ''}${redirectCheckOut ? `&checkOutDate=${redirectCheckOut}` : ''}`
          : '/profile?showCompleteProfileAlert=true'
        router.replace(profileUrl)
        return
      }

      if (authData.user.role === 'CLIENT' && authData.user.profileCompleted && safeRedirectTo) {
        router.replace(buildBookingRedirectUrl())
        return
      }

      router.replace('/dashboard')
    },
    onError: (error) => {
      setSubmitError(getLoginErrorMessage(error))
    },
  })

  const googleLoginMutation = useMutation({
    mutationFn: loginWithGoogle,
    onSuccess: (authData) => {
      signIn(authData)
      if (
        authData.user.role === 'ESTABLISHMENT_ADMIN' &&
        (!authData.user.profileCompleted || authData.user.mustChangePassword)
      ) {
        router.replace('/auth/onboarding')
        return
      }

      if (authData.user.role === 'CLIENT' && !authData.user.profileCompleted) {
        const profileUrl = safeRedirectTo
          ? `/profile?showCompleteProfileAlert=true&redirectTo=${encodeURIComponent(safeRedirectTo)}${redirectCheckIn ? `&checkInDate=${redirectCheckIn}` : ''}${redirectCheckOut ? `&checkOutDate=${redirectCheckOut}` : ''}`
          : '/profile?showCompleteProfileAlert=true'
        router.replace(profileUrl)
        return
      }

      if (authData.user.role === 'CLIENT' && authData.user.profileCompleted && safeRedirectTo) {
        router.replace(buildBookingRedirectUrl())
        return
      }

      router.replace('/dashboard')
    },
    onError: (error) => {
      setSubmitError(getGoogleLoginErrorMessage(error))
    },
  })

  const onSubmit = handleSubmit((formValues) => {
    setSubmitError(null)
    loginMutation.mutate(formValues)
  })

  return (
    <AuthShell
      actionLabel="Crear cuenta"
      actionText="¿Aún no tienes cuenta?"
      actionTo={registerHref}
      asideText="Gestiona disponibilidad, reservas y servicios desde una plataforma clara, rápida y confiable para alojamientos en el cantón de Sigchos."
      asideTitle="Organiza tu hospedaje sin complicaciones"
      subtitle="Ingresa con tu correo y contraseña para acceder al panel principal."
      title="Iniciar sesión"
    >
      <form className="flex flex-column gap-3" onSubmit={onSubmit}>
        {fromRegister && (
          <Message severity="success" text="Registro exitoso. Ahora inicia sesión para continuar." className="w-full" />
        )}

        {fromPasswordReset && (
          <Message severity="success" text="Contraseña actualizada correctamente. Inicia sesión para continuar." className="w-full" />
        )}

        <div className="flex flex-column gap-2">
          <label htmlFor="email" className="text-sm font-semibold text-900">Correo</label>
          <InputText
            id="email"
            autoComplete="email"
            placeholder="nombre@correo.com"
            type="email"
            className={errors.email ? 'p-invalid' : ''}
            {...register('email')}
          />
          {errors.email && (
            <small className="p-error">{errors.email.message}</small>
          )}
        </div>

        <div className="flex flex-column gap-2">
          <label htmlFor="password" className="text-sm font-semibold text-900">Contraseña</label>
          <InputText
            id="password"
            autoComplete="current-password"
            placeholder="********"
            type="password"
            className={errors.password ? 'p-invalid' : ''}
            {...register('password')}
          />
          {errors.password && (
            <small className="p-error">{errors.password.message}</small>
          )}
        </div>

        <div className="text-right">
          <Link
            className="text-sm font-semibold no-underline hover:underline"
            href="/auth/forgot-password"
            style={{ color: 'var(--primary-color)' }}
          >
            Olvidé mi contraseña
          </Link>
        </div>

        {submitError && (
          <Message severity="error" text={submitError} className="w-full" />
        )}

        <Button
          label={loginMutation.isPending ? 'Ingresando...' : 'Entrar al sistema'}
          type="submit"
          className="w-full mt-2"
          disabled={loginMutation.isPending || googleLoginMutation.isPending}
          loading={loginMutation.isPending}
        />

        <div className="flex align-items-center gap-3 my-3">
          <div className="flex-1 border-top-1 border-300"></div>
          <span className="text-xs font-semibold text-500 uppercase">o continuar con</span>
          <div className="flex-1 border-top-1 border-300"></div>
        </div>

        <GoogleSignInButton
          isLoading={loginMutation.isPending || googleLoginMutation.isPending}
          onSuccess={(idToken) => {
            setSubmitError(null)
            googleLoginMutation.mutate(idToken)
          }}
          onError={(err) => setSubmitError(err)}
          text="signin_with"
        />
      </form>
    </AuthShell>
  )
}
