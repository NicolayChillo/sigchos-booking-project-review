'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useRouter, useParams } from 'next/navigation';
import { z } from 'zod';
import { useAuth } from '@/lib/auth/AuthContext';
import { getApiErrorMessage } from '@/lib/http/getApiErrorMessage';
import { getEstablishmentById } from '@/modules/establishments/api/establishmentsApi';
import { getServiceByIdInEstablishment, updateServiceInEstablishment } from '@/modules/services/api/servicesApi';
import { SERVICE_CATEGORIES } from '@/modules/services/types';

import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';

const editSchema = z.object({
  category: z.enum(['WIFI', 'PARKING', 'ROOM_SERVICE', 'RESTAURANT', 'POOL', 'TRANSPORT', 'LAUNDRY', 'OTHER']),
  name: z.string().trim().min(3, 'Mínimo 3 caracteres.').max(50, 'Máximo 50 caracteres.'),
  description: z.string().trim().min(3, 'Mínimo 3 caracteres.').max(255, 'Máximo 255 caracteres.'),
  hasAdditionalCost: z.enum(['YES', 'NO']),
  additionalCost: z.string().trim().optional(),
}).superRefine((values, ctx) => {
  if (values.hasAdditionalCost === 'NO') return;
  const cost = values.additionalCost?.trim() ?? '';
  if (cost.length === 0) { ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Debes indicar el costo extra.', path: ['additionalCost'] }); return; }
  if (!/^\d+(\.\d{1,2})?$/.test(cost)) { ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Formato válido: 12.50', path: ['additionalCost'] }); return; }
  if (Number(cost) <= 0) { ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'El costo debe ser mayor a 0.', path: ['additionalCost'] }); }
});

type EditFormValues = z.infer<typeof editSchema>;

export default function ServiceEditPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const establishmentId = Number(params.id);
  const serviceId = Number(params.serviceId);
  const toast = useRef<Toast>(null);
    const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const canAccess = user?.role === 'ESTABLISHMENT_ADMIN';

  const estQuery = useQuery({
    queryKey: ['establishment', establishmentId],
    queryFn: () => getEstablishmentById(establishmentId),
    enabled: Number.isFinite(establishmentId) && canAccess && mounted,
  });

  const serviceQuery = useQuery({
    queryKey: ['service', establishmentId, serviceId],
    queryFn: () => getServiceByIdInEstablishment(establishmentId, serviceId),
    enabled: Number.isFinite(establishmentId) && Number.isFinite(serviceId) && canAccess && mounted,
  });

  const isOwnerViolation = user?.role === 'ESTABLISHMENT_ADMIN' && estQuery.data && estQuery.data.userId !== user?.id;

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { category: 'WIFI', name: '', description: '', hasAdditionalCost: 'NO', additionalCost: '' },
  });

  const hasAdditionalCost = form.watch('hasAdditionalCost');

  useEffect(() => {
    if (!serviceQuery.data) return;
    form.reset({
      category: serviceQuery.data.category,
      name: serviceQuery.data.name,
      description: serviceQuery.data.description,
      hasAdditionalCost: serviceQuery.data.hasAdditionalCost ? 'YES' : 'NO',
      additionalCost: serviceQuery.data.hasAdditionalCost ? String(serviceQuery.data.additionalCost ?? 0) : '',
    });
  }, [form, serviceQuery.data]);

  const updateMut = useMutation({
    mutationFn: (p: EditFormValues) => updateServiceInEstablishment(establishmentId, serviceId, {
      establishmentId, category: p.category, name: p.name, description: p.description,
      hasAdditionalCost: p.hasAdditionalCost === 'YES',
      additionalCost: p.hasAdditionalCost === 'YES' ? Number(p.additionalCost) : null,
    }),
    onSuccess: () => { router.push(`/establishments/${establishmentId}/services`); },
    onError: (error: any) => { toast.current?.show({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error, 'No se pudo actualizar el servicio.'), life: 5000 }); },
  });

  const onSubmit = form.handleSubmit((v) => { updateMut.mutate(v); });

  if (!mounted) return null;
  if (!canAccess) return <div className="card"><Message severity="error" text="No tienes permisos para editar servicios." className="w-full justify-content-start" /></div>;

  return (
    <div className="flex flex-column gap-3">
      <Toast ref={toast} />

      <div className="card flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center gap-3">
        <div>
          <h2 className="m-0 text-900">Editar Servicio</h2>
          <p className="mt-2 mb-0 text-600">
            Establecimiento: {estQuery.data?.name ?? 'Cargando...'}
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button
            label="Volver"
            icon="pi pi-arrow-left"
            outlined
            severity="secondary"
            onClick={() => router.push(`/establishments/${establishmentId}/services`)}
            className="w-full md:w-auto"
          />
          <Button
            type="submit"
            form="edit-service-form"
            label="Guardar cambios"
            icon="pi pi-save"
            loading={updateMut.isPending}
            className="w-full md:w-auto"
          />
        </div>
      </div>

      {serviceQuery.isLoading && <p className="text-600">Cargando servicio...</p>}
      {serviceQuery.isError && (
        <Message
          severity="error"
          text={getApiErrorMessage(serviceQuery.error, 'No se pudo cargar el servicio.')}
          className="w-full justify-content-start"
        />
      )}
      {isOwnerViolation && (
        <Message
          severity="error"
          text="No puedes editar servicios de un establecimiento que no te pertenece."
          className="w-full justify-content-start"
        />
      )}

      {serviceQuery.data && !isOwnerViolation && (
        <div className="card">
          <form id="edit-service-form" onSubmit={onSubmit} className="flex flex-column gap-4">
            <div className="grid">
              <div className="col-12 md:col-6 flex flex-column gap-2">
                <label className="font-semibold text-900">Categoría</label>
                <Controller
                  name="category"
                  control={form.control}
                  render={({ field }) => (
                    <Dropdown
                      id={field.name}
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      options={SERVICE_CATEGORIES as any}
                      optionLabel="label"
                      optionValue="value"
                      className="w-full"
                    />
                  )}
                />
              </div>

              <div className="col-12 md:col-6 flex flex-column gap-2">
                <label className="font-semibold text-900">Nombre del servicio</label>
                <InputText
                  {...form.register('name')}
                  placeholder="Ej: Desayuno buffet"
                  className={classNames({ 'p-invalid': form.formState.errors.name })}
                />
                {form.formState.errors.name && (
                  <small className="p-error">{form.formState.errors.name.message}</small>
                )}
              </div>

              <div className="col-12 flex flex-column gap-2 mt-2">
                <label className="font-semibold text-900">Descripción</label>
                <InputTextarea
                  {...form.register('description')}
                  rows={4}
                  placeholder="Detalles sobre qué incluye el servicio..."
                  className={classNames({ 'p-invalid': form.formState.errors.description })}
                />
                {form.formState.errors.description && (
                  <small className="p-error">{form.formState.errors.description.message}</small>
                )}
              </div>

              <div className="col-12 md:col-6 flex flex-column gap-2 mt-2">
                <label className="font-semibold text-900">¿Tiene costo extra?</label>
                <Controller
                  name="hasAdditionalCost"
                  control={form.control}
                  render={({ field }) => (
                    <Dropdown
                      id={field.name}
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      options={[
                        { label: 'No, está incluido', value: 'NO' },
                        { label: 'Sí, tiene costo adicional', value: 'YES' }
                      ]}
                      className="w-full"
                    />
                  )}
                />
              </div>

              {hasAdditionalCost === 'YES' && (
                <div className="col-12 md:col-6 flex flex-column gap-2 mt-2">
                  <label className="font-semibold text-900">Costo adicional (USD)</label>
                  <InputText
                    {...form.register('additionalCost')}
                    placeholder="Ej: 12.50"
                    className={classNames({ 'p-invalid': form.formState.errors.additionalCost })}
                  />
                  {form.formState.errors.additionalCost && (
                    <small className="p-error">{form.formState.errors.additionalCost.message}</small>
                  )}
                </div>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
