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
import { createMembershipRequest } from '@/modules/membershipRequests/api/membershipRequestsApi'
import { validateEcuadorRuc } from '@/lib/validators/validateEcuadorRuc'


const requestSchema = z.object({
  firstName: z.string().trim().min(1, 'Ingresa tu nombre.'),
  lastName: z.string().trim().min(1, 'Ingresa tu apellido.'),
  email: z.string().email('Ingresa un correo valido.'),
  ruc: z.string().trim()
    .min(1, 'El RUC es obligatorio.')
    .regex(/^\d{13}$/, 'El RUC debe tener exactamente 13 dígitos numéricos.')
    .refine((val) => validateEcuadorRuc(val), 'El RUC no es válido. Verifica que sea un RUC ecuatoriano correcto.'),
})

type RequestFormValues = z.infer<typeof requestSchema>

export default function MembershipRequestPage() {
  const [submitMessage, setSubmitMessage] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const requestForm = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      ruc: '',
    },
  })

  const { register, handleSubmit, formState: { errors } } = requestForm

  const requestMutation = useMutation({
    mutationFn: createMembershipRequest,
    onSuccess: () => {
      setSubmitMessage('Solicitud enviada. Te avisaremos por correo cuando sea revisada.')
      setIsSuccess(true)
      requestForm.reset()
    },
    onError: (error) => {
      setSubmitMessage(getApiErrorMessage(error, 'No se pudo enviar la solicitud.'))
      setIsSuccess(false)
    },
  })

  const onSubmit = handleSubmit((values) => {
    setSubmitMessage(null)
    requestMutation.mutate(values)
  })

  return (
    <div className="min-h-screen w-full">

      <main className="mx-auto px-4 pb-6 pt-5 md:px-6 lg:px-8" style={{ maxWidth: '1280px' }}>
        {/* Combined section */}
        <section className="surface-card border-round-lg shadow-2 mt-5 grid grid-nogutter overflow-hidden" id="solicitud">
          {/* Info section (Left) */}
          <div className="col-12 lg:col-6 p-5 md:p-7 surface-50 border-bottom-1 lg:border-bottom-none lg:border-right-1 surface-border">
            <h1 className="text-2xl md:text-3xl text-900 m-0">
              Registra tu establecimiento
            </h1>
            <p className="mt-3 text-sm md:text-base text-600">
              Si ofreces hospedaje en Sigchos y quieres aparecer en la pagina principal, envia una solicitud
              con tus datos y el RUC del negocio. El equipo verifica la informacion con el SRI antes de activar
              tu cuenta como administrador de establecimiento.
            </p>

            <div className="mt-5 flex flex-column gap-3">
              <div
                className="border-round-xl p-4"
                style={{ background: 'linear-gradient(135deg, rgba(80,188,178,0.12), rgba(243,215,144,0.12))', border: '1px solid rgba(80,188,178,0.25)' }}
              >
                <p className="text-sm font-semibold text-900 m-0">Que revisamos</p>
                <p className="mt-1 text-sm text-600 m-0">
                  Coincidencia de RUC, datos de contacto y coherencia con el tipo de operacion turistica.
                </p>
              </div>
              <div className="surface-card border-round-xl border-1 border-300 p-4">
                <p className="text-sm font-semibold text-900 m-0">Plazos</p>
                <p className="mt-1 text-sm text-600 m-0">
                  Recibiras un correo cuando la solicitud sea aprobada o si necesitamos mas informacion.
                </p>
              </div>
            </div>
          </div>

          {/* Form section (Right) */}
          <div className="col-12 lg:col-6 p-5 md:p-7">
            <h2 className="text-xl md:text-2xl font-semibold text-900 m-0">
              Enviar solicitud
            </h2>
            <p className="mt-1 text-sm text-600 m-0">
              Completa el formulario con datos reales; seran usados para crear tu usuario administrador si se aprueba.
            </p>

            <form className="mt-5 grid formgrid p-fluid" onSubmit={onSubmit}>
              <div className="field col-12 md:col-6">
                <label htmlFor="firstName" className="text-sm font-semibold text-900">Nombres</label>
                <InputText
                  id="firstName"
                  type="text"
                  className={errors.firstName ? 'p-invalid' : ''}
                  {...register('firstName')}
                />
                {errors.firstName && <small className="p-error">{errors.firstName.message}</small>}
              </div>

              <div className="field col-12 md:col-6">
                <label htmlFor="lastName" className="text-sm font-semibold text-900">Apellidos</label>
                <InputText
                  id="lastName"
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
                  type="email"
                  className={errors.email ? 'p-invalid' : ''}
                  {...register('email')}
                />
                {errors.email && <small className="p-error">{errors.email.message}</small>}
              </div>

              <div className="field col-12">
                <label htmlFor="ruc" className="text-sm font-semibold text-900">RUC</label>
                <InputText
                  id="ruc"
                  type="text"
                  inputMode="numeric"
                  className={errors.ruc ? 'p-invalid' : ''}
                  {...register('ruc', {
                    onChange: (e) => {
                      e.target.value = e.target.value.replace(/\D/g, '')
                    },
                  })}
                />
                {errors.ruc && <small className="p-error">{errors.ruc.message}</small>}
              </div>

              {submitMessage && (
                <div className="col-12">
                  <Message severity={isSuccess ? 'success' : 'error'} text={submitMessage} className="w-full" />
                </div>
              )}

              <div className="col-12 mt-2">
                <Button
                  label={requestMutation.isPending ? 'Enviando...' : 'Enviar solicitud'}
                  type="submit"
                  icon="pi pi-send"
                  disabled={requestMutation.isPending}
                  loading={requestMutation.isPending}
                />
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  )
}
