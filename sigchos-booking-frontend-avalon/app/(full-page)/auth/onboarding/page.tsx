'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { InputText } from 'primereact/inputtext'
import { Button } from 'primereact/button'
import { Message } from 'primereact/message'
import { useAuth } from '@/lib/auth/AuthContext'
import { getApiErrorMessage } from '@/lib/http/getApiErrorMessage'
import { completeOnboarding } from '@/modules/profile/api/profileApi'

const onboardingSchema = z
  .object({
    firstName: z.string().trim().min(1, 'Ingresa tu nombre.'),
    lastName: z.string().trim().min(1, 'Ingresa tu apellido.'),
    phone: z.string().trim().min(7, 'Ingresa un teléfono válido.'),
    birthDate: z.string().min(1, 'Selecciona una fecha de nacimiento.'),
    currentPassword: z.string().min(1, 'Ingresa la contraseña temporal.'),
    newPassword: z
      .string()
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,100}$/,
        'Debe incluir mayúscula, minúscula y número (mín. 8 caracteres).'
      ),
    confirmPassword: z.string().min(8, 'Confirma la nueva contraseña.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Las contraseñas no coinciden.',
  })

type OnboardingFormValues = z.infer<typeof onboardingSchema>

export default function OnboardingPage() {
  const router = useRouter()
  const { user, updateUser } = useAuth()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const onboardingForm = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      phone: user?.phone ?? '',
      birthDate: user?.birthDate ?? '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const { register, handleSubmit, formState: { errors } } = onboardingForm

  const onboardingMutation = useMutation({
    mutationFn: completeOnboarding,
    onSuccess: (updatedUser) => {
      updateUser(updatedUser)
      router.replace('/dashboard')
    },
    onError: (error) => {
      setSubmitError(
        getApiErrorMessage(error, 'No fue posible completar tu perfil.'),
      )
    },
  })

  const onSubmit = handleSubmit((values) => {
    setSubmitError(null)
    onboardingMutation.mutate({
      firstName: values.firstName,
      lastName: values.lastName,
      phone: values.phone,
      birthDate: values.birthDate,
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    })
  })

  return (
    <section className="flex align-items-center justify-content-center min-h-screen px-4 py-6">
      <article className="w-full surface-card border-round-3xl shadow-4 p-5 md:p-7" style={{ maxWidth: '56rem' }}>
        <div style={{ maxWidth: '40rem' }}>
          <span className="text-sm font-semibold uppercase letter-spacing" style={{ color: 'var(--primary-color)', letterSpacing: '0.18em' }}>
            Primer acceso
          </span>
          <h1 className="mt-2 text-3xl md:text-4xl text-900">
            Completa tu perfil para continuar
          </h1>
          <p className="mt-2 text-sm md:text-base text-600">
            Verificamos tu solicitud y ahora necesitas completar tus datos y
            cambiar la contraseña temporal.
          </p>
        </div>

        <form className="grid formgrid p-fluid mt-5" onSubmit={onSubmit}>
          <div className="field col-12 md:col-6">
            <label htmlFor="firstName" className="text-sm font-semibold text-900">Nombre</label>
            <InputText
              id="firstName"
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
              type="text"
              className={errors.lastName ? 'p-invalid' : ''}
              {...register('lastName')}
            />
            {errors.lastName && <small className="p-error">{errors.lastName.message}</small>}
          </div>

          <div className="field col-12 md:col-6">
            <label htmlFor="phone" className="text-sm font-semibold text-900">Teléfono</label>
            <InputText
              id="phone"
              type="tel"
              className={errors.phone ? 'p-invalid' : ''}
              {...register('phone')}
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

          <div className="field col-12">
            <label htmlFor="currentPassword" className="text-sm font-semibold text-900">Contraseña temporal</label>
            <InputText
              id="currentPassword"
              autoComplete="current-password"
              type="password"
              className={errors.currentPassword ? 'p-invalid' : ''}
              {...register('currentPassword')}
            />
            {errors.currentPassword && <small className="p-error">{errors.currentPassword.message}</small>}
          </div>

          <div className="field col-12 md:col-6">
            <label htmlFor="newPassword" className="text-sm font-semibold text-900">Nueva contraseña</label>
            <InputText
              id="newPassword"
              autoComplete="new-password"
              type="password"
              className={errors.newPassword ? 'p-invalid' : ''}
              {...register('newPassword')}
            />
            {errors.newPassword && <small className="p-error">{errors.newPassword.message}</small>}
          </div>

          <div className="field col-12 md:col-6">
            <label htmlFor="confirmPassword" className="text-sm font-semibold text-900">Confirmar contraseña</label>
            <InputText
              id="confirmPassword"
              autoComplete="new-password"
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
              label={onboardingMutation.isPending ? 'Guardando...' : 'Completar perfil'}
              type="submit"
              className="w-full"
              disabled={onboardingMutation.isPending}
              loading={onboardingMutation.isPending}
            />
          </div>
        </form>
      </article>
    </section>
  )
}
