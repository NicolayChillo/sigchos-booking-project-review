'use client'

import { useState, useMemo } from 'react'
import { useMutation } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useRouter, useSearchParams } from 'next/navigation'
import { z } from 'zod'
import { InputText } from 'primereact/inputtext'
import { Button } from 'primereact/button'
import { Message } from 'primereact/message'
import { useAuth } from '@/lib/auth/AuthContext'
import { getRegisterErrorMessage, getGoogleLoginErrorMessage } from '@/lib/http/getAuthErrorMessage'
import { register as registerUser, loginWithGoogle } from '@/modules/auth/api/authApi'
import { AuthShell } from '@/modules/auth/components/AuthShell'
import { GoogleSignInButton } from '@/modules/auth/components/GoogleSignInButton'

const registerSchema = z
  .object({
    firstName: z.string().trim().min(1, 'Ingresa tu nombre.').regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'El nombre solo puede contener letras.'),
    lastName: z.string().trim().min(1, 'Ingresa tu apellido.').regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'El apellido solo puede contener letras.'),
    email: z.string().email('Ingresa un correo válido.'),
    phone: z.string().trim().min(7, 'Ingresa un número válido.').regex(/^\d+$/, 'El teléfono solo puede contener números.'),
    birthDate: z.string().min(1, 'Selecciona una fecha.')
      .refine((val) => {
        const date = new Date(val)
        return !Number.isNaN(date.getTime())
      }, 'Ingresa una fecha válida.')
      .refine((val) => {
        const date = new Date(val)
        return date <= new Date()
      }, 'La fecha de nacimiento no puede ser futura.')
      .refine((val) => {
        const date = new Date(val)
        const minDate = new Date()
        minDate.setFullYear(minDate.getFullYear() - 120)
        return date >= minDate
      }, 'Ingresa una fecha de nacimiento coherente.'),
    password: z
      .string()
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,100}$/,
        'Debe incluir mayúscula, minúscula y número (mín. 8 caracteres).'
      ),
    confirmPassword: z
      .string()
      .min(8, 'Confirma la contraseña con al menos 8 caracteres.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Las contraseñas no coinciden.',
  })

type RegisterFormValues = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn } = useAuth()
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Booking redirect params — forwarded from room page through login
  const redirectTo = searchParams.get('redirectTo') ?? ''
  const redirectCheckIn = searchParams.get('checkInDate') ?? ''
  const redirectCheckOut = searchParams.get('checkOutDate') ?? ''

  // Only allow redirects to internal landing routes
  const safeRedirectTo = redirectTo.startsWith('/landing/') ? redirectTo : ''

  function buildBookingRedirectUrl() {
    if (!safeRedirectTo) return '/dashboard'
    const params = new URLSearchParams()
    if (redirectCheckIn) params.set('checkInDate', redirectCheckIn)
    if (redirectCheckOut) params.set('checkOutDate', redirectCheckOut)
    const qs = params.toString()
    return qs ? `${safeRedirectTo}?${qs}` : safeRedirectTo
  }

  // Build login link preserving booking context
  const loginHref = useMemo(() => {
    if (!safeRedirectTo) return '/auth/login'
    const params = new URLSearchParams()
    params.set('redirectTo', safeRedirectTo)
    if (redirectCheckIn) params.set('checkInDate', redirectCheckIn)
    if (redirectCheckOut) params.set('checkOutDate', redirectCheckOut)
    return `/auth/login?${params.toString()}`
  }, [safeRedirectTo, redirectCheckIn, redirectCheckOut])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      birthDate: '',
      password: '',
      confirmPassword: '',
    },
  })

  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (_, values) => {
      // Forward booking context so after login the user lands back at the room
      const params = new URLSearchParams({ fromRegister: 'true', email: values.email })
      if (safeRedirectTo) params.set('redirectTo', safeRedirectTo)
      if (redirectCheckIn) params.set('checkInDate', redirectCheckIn)
      if (redirectCheckOut) params.set('checkOutDate', redirectCheckOut)
      router.replace(`/auth/login?${params.toString()}`)
    },
    onError: (error) => {
      setSubmitError(getRegisterErrorMessage(error))
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

    const { confirmPassword: _confirmPassword, ...payload } = formValues
    registerMutation.mutate(payload)
  })

  return (
    <AuthShell
      actionLabel="Iniciar sesión"
      actionText="¿Ya tienes cuenta?"
      actionTo={loginHref}
      asideText="Activa tu cuenta y empieza a administrar estancias, servicios y procesos de atención con una experiencia consistente."
      asideTitle="Regístrate y lleva tu hospedaje al siguiente nivel"
      subtitle="Completa tus datos para crear una cuenta de cliente."
      title="Registro"
    >
      <form className="grid formgrid p-fluid" onSubmit={onSubmit}>
        <div className="field col-12 md:col-6">
          <label htmlFor="firstName" className="text-sm font-semibold text-900">Nombre</label>
          <InputText
            id="firstName"
            placeholder="Juan"
            type="text"
            className={errors.firstName ? 'p-invalid' : ''}
            {...register('firstName')}
          />
          {errors.firstName && <small className="p-error">{errors.firstName.message}</small>}
        </div>

        <div className="field col-12 md:col-6">
          <label htmlFor="lastName" className="text-sm font-semibold text-900">Apellido</label>
          <InputText
            id="lastName"
            placeholder="Pérez"
            type="text"
            className={errors.lastName ? 'p-invalid' : ''}
            {...register('lastName')}
          />
          {errors.lastName && <small className="p-error">{errors.lastName.message}</small>}
        </div>

        <div className="field col-12">
          <label htmlFor="email" className="text-sm font-semibold text-900">Correo</label>
          <InputText
            id="email"
            placeholder="nombre@correo.com"
            type="email"
            className={errors.email ? 'p-invalid' : ''}
            {...register('email')}
          />
          {errors.email && <small className="p-error">{errors.email.message}</small>}
        </div>

        <div className="field col-12 md:col-6">
          <label htmlFor="phone" className="text-sm font-semibold text-900">Teléfono</label>
          <InputText
            id="phone"
            placeholder="0999999999"
            type="tel"
            inputMode="numeric"
            className={errors.phone ? 'p-invalid' : ''}
            {...register('phone', {
              onChange: (e) => {
                e.target.value = e.target.value.replace(/\D/g, '')
              },
            })}
          />
          {errors.phone && <small className="p-error">{errors.phone.message}</small>}
        </div>

        <div className="field col-12 md:col-6">
          <label htmlFor="birthDate" className="text-sm font-semibold text-900">Fecha de nacimiento</label>
          <InputText
            id="birthDate"
            type="date"
            className={errors.birthDate ? 'p-invalid' : ''}
            {...register('birthDate')}
          />
          {errors.birthDate && <small className="p-error">{errors.birthDate.message}</small>}
        </div>

        <div className="field col-12 md:col-6">
          <label htmlFor="password" className="text-sm font-semibold text-900">Contraseña</label>
          <InputText
            id="password"
            placeholder="********"
            type="password"
            className={errors.password ? 'p-invalid' : ''}
            {...register('password')}
          />
          {errors.password && <small className="p-error">{errors.password.message}</small>}
        </div>

        <div className="field col-12 md:col-6">
          <label htmlFor="confirmPassword" className="text-sm font-semibold text-900">Confirmar contraseña</label>
          <InputText
            id="confirmPassword"
            placeholder="********"
            type="password"
            className={errors.confirmPassword ? 'p-invalid' : ''}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && <small className="p-error">{errors.confirmPassword.message}</small>}
        </div>

        {submitError && (
          <div className="col-12">
            <Message severity="error" text={submitError} className="w-full" />
          </div>
        )}

        <div className="col-12">
          <Button
            label={registerMutation.isPending ? 'Registrando cuenta...' : 'Crear cuenta'}
            type="submit"
            className="w-full mt-2"
            disabled={registerMutation.isPending || googleLoginMutation.isPending}
            loading={registerMutation.isPending}
          />
        </div>

        <div className="col-12 flex align-items-center gap-3 my-3">
          <div className="flex-1 border-top-1 border-300"></div>
          <span className="text-xs font-semibold text-500 uppercase">o continuar con</span>
          <div className="flex-1 border-top-1 border-300"></div>
        </div>

        <div className="col-12">
          <GoogleSignInButton
            isLoading={registerMutation.isPending || googleLoginMutation.isPending}
            onSuccess={(idToken) => {
              setSubmitError(null)
              googleLoginMutation.mutate(idToken)
            }}
            onError={(err) => setSubmitError(err)}
            text="signup_with"
          />
        </div>
      </form>
    </AuthShell>
  )
}
