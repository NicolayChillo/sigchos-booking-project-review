'use client'

import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useRouter, useSearchParams } from 'next/navigation'
import { z } from 'zod'
import { InputText } from 'primereact/inputtext'
import { Button } from 'primereact/button'
import { Message } from 'primereact/message'
import { getApiErrorMessage } from '@/lib/http/getApiErrorMessage'
import { resetPassword } from '@/modules/auth/api/authApi'
import { AuthShell } from '@/modules/auth/components/AuthShell'

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,100}$/,
        'Debe incluir mayúscula, minúscula y número (mín. 8 caracteres).'
      ),
    confirmPassword: z
      .string()
      .min(8, 'Confirma la contraseña con al menos 8 caracteres.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Las contraseñas no coinciden.',
  })

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const token = useMemo(() => searchParams.get('token')?.trim() || '', [searchParams])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  })

  const resetPasswordMutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: () => {
      router.replace('/auth/login?fromPasswordReset=true')
    },
    onError: (error) => {
      setSubmitError(
        getApiErrorMessage(error, 'No fue posible restablecer la contraseña.'),
      )
    },
  })

  const onSubmit = handleSubmit((formValues) => {
    if (!token) {
      setSubmitError('El enlace de recuperación no es válido.')
      return
    }

    setSubmitError(null)

    resetPasswordMutation.mutate({
      token,
      newPassword: formValues.newPassword,
    })
  })

  return (
    <AuthShell
      actionLabel="Iniciar sesión"
      actionText="¿Ya tienes una nueva contraseña?"
      actionTo="/auth/login"
      asideText="Cambia tu contraseña y vuelve a entrar con un acceso seguro."
      asideTitle="Restablece tu contraseña"
      subtitle="Ingresa tu nueva contraseña para finalizar la recuperación."
      title="Nueva contraseña"
    >
      <form className="flex flex-column gap-3" onSubmit={onSubmit}>
        {!token && (
          <Message severity="error" text="El enlace de recuperación es inválido o está incompleto." className="w-full" />
        )}

        <div className="flex flex-column gap-2">
          <label htmlFor="newPassword" className="text-sm font-semibold text-900">Nueva contraseña</label>
          <InputText
            id="newPassword"
            autoComplete="new-password"
            placeholder="********"
            type="password"
            className={errors.newPassword ? 'p-invalid' : ''}
            {...register('newPassword')}
          />
          {errors.newPassword && (
            <small className="p-error">{errors.newPassword.message}</small>
          )}
        </div>

        <div className="flex flex-column gap-2">
          <label htmlFor="confirmPassword" className="text-sm font-semibold text-900">Confirmar contraseña</label>
          <InputText
            id="confirmPassword"
            autoComplete="new-password"
            placeholder="********"
            type="password"
            className={errors.confirmPassword ? 'p-invalid' : ''}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <small className="p-error">{errors.confirmPassword.message}</small>
          )}
        </div>

        {submitError && (
          <Message severity="error" text={submitError} className="w-full" />
        )}

        <Button
          label={resetPasswordMutation.isPending ? 'Restableciendo...' : 'Guardar nueva contraseña'}
          type="submit"
          className="w-full mt-2"
          disabled={resetPasswordMutation.isPending || !token}
          loading={resetPasswordMutation.isPending}
        />
      </form>
    </AuthShell>
  )
}
