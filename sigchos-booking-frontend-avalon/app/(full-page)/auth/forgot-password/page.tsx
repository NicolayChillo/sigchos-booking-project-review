'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { InputText } from 'primereact/inputtext'
import { Button } from 'primereact/button'
import { Message } from 'primereact/message'
import { getApiErrorMessage } from '@/lib/http/getApiErrorMessage'
import { forgotPassword } from '@/modules/auth/api/authApi'
import { AuthShell } from '@/modules/auth/components/AuthShell'

const forgotPasswordSchema = z.object({
  email: z.string().email('Ingresa un correo válido.'),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const forgotPasswordMutation = useMutation({
    mutationFn: forgotPassword,
    onSuccess: () => {
      setSuccessMessage(
        'Si el correo existe en el sistema, recibirás un enlace de recuperación en unos minutos.',
      )
    },
    onError: (error) => {
      setSubmitError(
        getApiErrorMessage(error, 'No fue posible procesar la solicitud en este momento.'),
      )
    },
  })

  const onSubmit = handleSubmit((formValues) => {
    setSubmitError(null)
    setSuccessMessage(null)
    forgotPasswordMutation.mutate(formValues)
  })

  return (
    <AuthShell
      actionLabel="Iniciar sesión"
      actionText="¿Recordaste tu contraseña?"
      actionTo="/auth/login"
      asideText="Protege el acceso a tu cuenta recuperando credenciales de forma segura y rápida."
      asideTitle="Recupera el acceso"
      subtitle="Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña."
      title="Olvidé mi contraseña"
    >
      <form className="flex flex-column gap-3" onSubmit={onSubmit}>
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

        {submitError && (
          <Message severity="error" text={submitError} className="w-full" />
        )}

        {successMessage && (
          <Message severity="success" text={successMessage} className="w-full" />
        )}

        <Button
          label={forgotPasswordMutation.isPending ? 'Enviando enlace...' : 'Enviar enlace de recuperación'}
          type="submit"
          className="w-full mt-2"
          disabled={forgotPasswordMutation.isPending}
          loading={forgotPasswordMutation.isPending}
        />
      </form>
    </AuthShell>
  )
}
