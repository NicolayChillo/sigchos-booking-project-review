'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { useRouter, useParams } from 'next/navigation';
import { z } from 'zod';
import dynamic from 'next/dynamic';

import { useAuth } from '@/lib/auth/AuthContext';
import { getApiErrorMessage } from '@/lib/http/getApiErrorMessage';
import {
  getEstablishmentById,
  updateEstablishment
} from '@/modules/establishments/api/establishmentsApi';
import type { EstablishmentImageResponse } from '@/modules/establishmentImages/types';
import {
  isEstablishmentIncomplete,
  getMissingFields
} from '@/modules/establishments/utils/establishmentUtils';
import { EstablishmentIncompleteAlert } from '@/modules/establishments/components/EstablishmentIncompleteAlert';
import { PARISH_OPTIONS } from '@/modules/establishments/constants/parishes';

import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import { InputNumber } from 'primereact/inputnumber';
import { TabView, TabPanel } from 'primereact/tabview';
import { GalleryInput } from '@/modules/shared/components/GalleryInput';

const MapLocationPicker = dynamic(
  () => import('@/modules/establishments/components/MapLocationPicker'),
  { ssr: false }
);

const editSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Minimo 3 caracteres.')
    .max(50, 'Maximo 50 caracteres.'),
  description: z
    .string()
    .trim()
    .min(3, 'Minimo 3 caracteres.')
    .max(255, 'Maximo 255 caracteres.'),
  address: z
    .string()
    .trim()
    .min(3, 'Minimo 3 caracteres.')
    .max(255, 'Maximo 255 caracteres.'),
  images: z.array(
    z.object({
      id: z.number(),
      file: z.file().mime(['image/jpeg', 'image/png', 'image/webp']).nullable(),
      url: z.string(),
      isPrimary: z.boolean(),
      isNew: z.boolean()
    })
  ),
  checkInTime: z
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Formato valido: HH:mm'),
  checkOutTime: z
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Formato valido: HH:mm'),
  advancePaymentPolicy: z
    .string()
    .trim()
    .min(3, 'Minimo 3 caracteres.')
    .max(500, 'Maximo 500 caracteres.'),
  cancellationPolicy: z
    .string()
    .trim()
    .min(3, 'Minimo 3 caracteres.')
    .max(500, 'Maximo 500 caracteres.'),
  cancelPenaltyWindowHours: z
    .union([z.literal(24), z.literal(48), z.literal(72)])
    .nullable(),
  cancelPenaltyAfterEnabled: z.boolean(),
  cancelPenaltyAfterPercentage: z
    .number()
    .int()
    .min(1, 'Minimo 1%.')
    .max(100, 'Maximo 100%.')
    .nullable(),
  childrenPolicy: z
    .string()
    .trim()
    .min(3, 'Minimo 3 caracteres.')
    .max(500, 'Maximo 500 caracteres.'),
  ageRestrictionPolicy: z
    .string()
    .trim()
    .min(3, 'Minimo 3 caracteres.')
    .max(255, 'Maximo 255 caracteres.'),
  petsPolicy: z
    .string()
    .trim()
    .min(3, 'Minimo 3 caracteres.')
    .max(500, 'Maximo 500 caracteres.'),
  parish: z.string().min(1, 'Selecciona una parroquia.'),
  latitude: z.number({ message: 'Selecciona la ubicación en el mapa.' }),
  longitude: z.number({ message: 'Selecciona la ubicación en el mapa.' }),
  payphoneToken: z.string().trim().optional().nullable(),
  payphoneStoreId: z.string().trim().optional().nullable(),
  bankName: z.string().trim().optional().nullable(),
  bankAccountType: z.string().trim().optional().nullable(),
  bankAccountNumber: z.string().trim().optional().nullable(),
  bankAccountOwnerName: z.string().trim().optional().nullable(),
  bankAccountOwnerId: z.string().trim().optional().nullable(),
  otherPolicies: z.array(
    z.object({ value: z.string().trim().min(1, 'La política no puede estar vacía.').max(500, 'Máximo 500 caracteres.') })
  )
});

type EditFormValues = z.infer<typeof editSchema>;

function buildCancellationPolicyText(values: {
  cancelPenaltyWindowHours: 24 | 48 | 72 | null;
  cancelPenaltyAfterEnabled: boolean;
  cancelPenaltyAfterPercentage: number | null;
}): string {
  const {
    cancelPenaltyWindowHours,
    cancelPenaltyAfterEnabled,
    cancelPenaltyAfterPercentage
  } = values;

  if (!cancelPenaltyAfterEnabled) {
    return 'No se aplican penalizaciones por cancelacion.';
  }

  const windowLabel = cancelPenaltyWindowHours ?? 24;
  return `Si cancelas con menos de ${windowLabel} horas de anticipacion, se aplicara una penalizacion del ${
    cancelPenaltyAfterPercentage ?? 0
  }% del pago. Si cancelas con ${windowLabel} horas o mas de anticipacion, no se aplicara penalizacion.`;
}

// Mapping: field name → tab index
const FIELD_TAB_MAP: Record<string, number> = {
  name: 0,
  description: 0,
  images: 1,
  address: 2,
  parish: 2,
  latitude: 2,
  longitude: 2,
  checkInTime: 3,
  checkOutTime: 3,
  advancePaymentPolicy: 3,
  cancellationPolicy: 3,
  cancelPenaltyWindowHours: 3,
  cancelPenaltyAfterEnabled: 3,
  cancelPenaltyAfterPercentage: 3,
  childrenPolicy: 3,
  ageRestrictionPolicy: 3,
  petsPolicy: 3,
  otherPolicies: 3,
  payphoneToken: 4,
  payphoneStoreId: 4,
  bankName: 4,
  bankAccountType: 4,
  bankAccountNumber: 4,
  bankAccountOwnerName: 4,
  bankAccountOwnerId: 4
};

export default function EstablishmentEditPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const establishmentId = Number(params.id);
  const toast = useRef<Toast>(null);
  const [mounted, setMounted] = useState(false);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const canAccessEstablishments = user?.role === 'ESTABLISHMENT_ADMIN';

  const detailQuery = useQuery({
    queryKey: ['establishment', establishmentId],
    queryFn: () => getEstablishmentById(establishmentId),
    enabled:
      Number.isFinite(establishmentId) && canAccessEstablishments && mounted
  });

  const incomplete = detailQuery.data
    ? isEstablishmentIncomplete(detailQuery.data)
    : false;
  const missingFields = detailQuery.data
    ? getMissingFields(detailQuery.data)
    : [];

  const editForm = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: '',
      description: '',
      address: '',
      images: [],
      checkInTime: '14:00',
      checkOutTime: '12:00',
      advancePaymentPolicy: '',
      cancellationPolicy: '',
      cancelPenaltyWindowHours: null,
      cancelPenaltyAfterEnabled: false,
      cancelPenaltyAfterPercentage: null,
      childrenPolicy: '',
      ageRestrictionPolicy: '',
      petsPolicy: '',
      parish: '',
      latitude: undefined as unknown as number,
      longitude: undefined as unknown as number,
      payphoneToken: '',
      payphoneStoreId: '',
      bankName: '',
      bankAccountType: '',
      bankAccountNumber: '',
      bankAccountOwnerName: '',
      bankAccountOwnerId: '',
      otherPolicies: []
    }
  });

  useEffect(() => {
    if (!detailQuery.data) return;

    editForm.reset({
      name: detailQuery.data.name,
      description: detailQuery.data.description,
      address: detailQuery.data.address,
      images: detailQuery.data.images.map((img: EstablishmentImageResponse) => ({
        file: null,
        id: img.id,
        isNew: false,
        url: img.url,
        isPrimary: img.isPrimary
      })),
      checkInTime: detailQuery.data.checkInTime ?? '14:00',
      checkOutTime: detailQuery.data.checkOutTime ?? '12:00',
      advancePaymentPolicy: detailQuery.data.advancePaymentPolicy ?? '',
      cancellationPolicy: detailQuery.data.cancellationPolicy ?? '',
      cancelPenaltyWindowHours:
        (detailQuery.data.cancelPenaltyWindowHours as any) ?? null,
      cancelPenaltyAfterEnabled:
        detailQuery.data.cancelPenaltyAfterEnabled ?? false,
      cancelPenaltyAfterPercentage:
        detailQuery.data.cancelPenaltyAfterPercentage ?? null,
      childrenPolicy: detailQuery.data.childrenPolicy ?? '',
      ageRestrictionPolicy: detailQuery.data.ageRestrictionPolicy ?? '',
      petsPolicy: detailQuery.data.petsPolicy ?? '',
      parish: detailQuery.data.parish ?? '',
      latitude: detailQuery.data.latitude ?? (undefined as unknown as number),
      longitude: detailQuery.data.longitude ?? (undefined as unknown as number),
      payphoneToken: '',
      payphoneStoreId: '',
      bankName: detailQuery.data.bankName ?? '',
      bankAccountType: detailQuery.data.bankAccountType ?? '',
      bankAccountNumber: detailQuery.data.bankAccountNumber ?? '',
      bankAccountOwnerName: detailQuery.data.bankAccountOwnerName ?? '',
      bankAccountOwnerId: detailQuery.data.bankAccountOwnerId ?? '',
      otherPolicies: (detailQuery.data.otherPolicies ?? []).map((v: string) => ({ value: v }))
    });
  }, [detailQuery.data, editForm]);

  const cancelPenaltyAfterEnabled = editForm.watch('cancelPenaltyAfterEnabled');
  const cancelPenaltyWindowHours = editForm.watch('cancelPenaltyWindowHours');
  const cancelPenaltyAfterPercentage = editForm.watch(
    'cancelPenaltyAfterPercentage'
  );

  const { fields: otherPoliciesFields, append: appendPolicy, remove: removePolicy } =
    useFieldArray({ control: editForm.control, name: 'otherPolicies' });

  useEffect(() => {
    if (!detailQuery.data) return;

    if (!cancelPenaltyAfterEnabled) {
      editForm.setValue('cancelPenaltyWindowHours', null, {
        shouldValidate: true
      });
      editForm.setValue('cancelPenaltyAfterPercentage', null, {
        shouldValidate: true
      });
      editForm.setValue(
        'cancellationPolicy',
        'No se aplican penalizaciones por cancelacion.'
      );
      return;
    }

    if (!cancelPenaltyWindowHours) {
      editForm.setValue('cancelPenaltyWindowHours', 24, {
        shouldValidate: true
      });
    }

    if (cancelPenaltyAfterEnabled && !cancelPenaltyAfterPercentage) {
      editForm.setValue('cancelPenaltyAfterPercentage', 50, {
        shouldValidate: true
      });
    }

    editForm.setValue(
      'cancellationPolicy',
      buildCancellationPolicyText({
        cancelPenaltyWindowHours: cancelPenaltyWindowHours ?? 24,
        cancelPenaltyAfterEnabled,
        cancelPenaltyAfterPercentage
      })
    );
  }, [
    detailQuery.data,
    cancelPenaltyWindowHours,
    cancelPenaltyAfterEnabled,
    cancelPenaltyAfterPercentage,
    editForm
  ]);

  const updateMutation = useMutation({
    mutationFn: async (payload: EditFormValues) => {
      const targetUserId = detailQuery.data?.userId;
      if (!targetUserId) {
        throw new Error(
          'No se pudo determinar el usuario propietario del establecimiento.'
        );
      }

      return updateEstablishment(establishmentId, {
        userId: targetUserId,
        ...payload,
        payphoneToken: payload.payphoneToken?.trim() || null,
        payphoneStoreId: payload.payphoneStoreId?.trim() || null,
        bankName: payload.bankName?.trim() || null,
        bankAccountType: payload.bankAccountType?.trim() || null,
        bankAccountNumber: payload.bankAccountNumber?.trim() || null,
        bankAccountOwnerName: payload.bankAccountOwnerName?.trim() || null,
        bankAccountOwnerId: payload.bankAccountOwnerId?.trim() || null,
        otherPolicies: payload.otherPolicies.map((p) => p.value),
        images: payload.images.map((img) => {
          return img.isNew && img.file
            ? {
                id: null,
                file: img.file,
                isPrimary: img.isPrimary
              }
            : {
                id: img.id,
                file: img.file,
                isPrimary: img.isPrimary
              };
        })
      });
    },
    onSuccess: () => {
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Establecimiento actualizado',
        life: 3000
      });
      router.push(`/establishments/${establishmentId}`);
    },
    onError: (error) => {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: getApiErrorMessage(
          error,
          'No se pudo actualizar el establecimiento.'
        ),
        life: 5000
      });
    }
  });

  const isOwnerViolation =
    user?.role === 'ESTABLISHMENT_ADMIN' &&
    detailQuery.data &&
    detailQuery.data.userId !== user.id;

  const onEditSubmit = editForm.handleSubmit(
    (values) => {
      updateMutation.mutate(values);
    },
    (errors) => {
      // Find the lowest tab index that has an error and navigate to it
      const errorFields = Object.keys(errors);
      const tabsWithErrors = [...new Set(errorFields.map((f) => FIELD_TAB_MAP[f] ?? 0))];
      const firstErrorTab = Math.min(...tabsWithErrors);
      setActiveTabIndex(firstErrorTab);
      toast.current?.show({
        severity: 'warn',
        summary: 'Formulario incompleto',
        detail: 'Revisa las pestañas para corregir los campos marcados en rojo.',
        life: 5000
      });
    }
  );

  // Compute which tabs have form errors for the error badge indicator
  const formErrors = editForm.formState.errors;
  const tabsWithErrors = new Set(
    Object.keys(formErrors).map((f) => FIELD_TAB_MAP[f] ?? 0)
  );

  // Helper to render tab header with optional error badge
  function tabHeader(label: string, tabIndex: number) {
    const hasError = tabsWithErrors.has(tabIndex);
    return (
      <span className="flex align-items-center gap-2">
        {label}
        {hasError && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              backgroundColor: 'var(--red-500)',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 700,
              lineHeight: 1,
              flexShrink: 0
            }}
            title={`Esta pestaña tiene campos obligatorios sin completar`}
          >
            !
          </span>
        )}
      </span>
    );
  }

  if (!mounted) return null;

  if (!canAccessEstablishments) {
    return (
      <div className="card">
        <Message
          severity="error"
          text="No tienes permisos para editar establecimientos."
          className="w-full justify-content-start"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-column gap-3">
      <Toast ref={toast} />

      <div className="card flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center gap-3">
        <div>
          <h2 className="m-0 text-900">
            {incomplete
              ? 'Completar información del establecimiento'
              : 'Editar establecimiento'}
          </h2>
          <p className="mt-2 mb-0 text-600">
            {incomplete
              ? 'Tu establecimiento fue aprobado. Completa todos los campos para que sea visible en el catálogo.'
              : 'Modifica la información del establecimiento seleccionado.'}
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button
            label="Volver"
            icon="pi pi-arrow-left"
            outlined
            severity="secondary"
            onClick={() => router.push(`/establishments/${establishmentId}`)}
            className="w-full md:w-auto"
          />
          <Button
            type="submit"
            form="edit-establishment-form"
            label="Guardar cambios"
            icon="pi pi-save"
            loading={updateMutation.isPending}
            className="w-full md:w-auto"
          />
        </div>
      </div>

      {detailQuery.isLoading && (
        <p className="text-600">Cargando establecimiento...</p>
      )}

      {detailQuery.isError && (
        <Message
          severity="error"
          text={getApiErrorMessage(
            detailQuery.error,
            'No se pudo cargar el establecimiento.'
          )}
          className="w-full justify-content-start mb-4"
        />
      )}

      {isOwnerViolation && (
        <Message
          severity="error"
          text="No puedes editar este establecimiento porque no pertenece a tu cuenta."
          className="w-full justify-content-start mb-4"
        />
      )}

      {detailQuery.data && !isOwnerViolation && (
        <>
          {incomplete && (
            <EstablishmentIncompleteAlert missingFields={missingFields} />
          )}

          <div className="card">
            <form
              id="edit-establishment-form"
              onSubmit={onEditSubmit}
              className="flex flex-column gap-4"
            >
              <TabView activeIndex={activeTabIndex} onTabChange={(e) => setActiveTabIndex(e.index)}>
                <TabPanel header={tabHeader('General', 0)} className="flex flex-column gap-4">
                  <div className="flex flex-column gap-2 mt-2">
                    <label className="font-semibold text-900">Nombre</label>
                    <InputText
                      {...editForm.register('name')}
                      className={classNames({
                        'p-invalid': editForm.formState.errors.name
                      })}
                    />
                    {editForm.formState.errors.name && (
                      <small className="p-error">
                        {editForm.formState.errors.name.message}
                      </small>
                    )}
                  </div>

                  <div className="flex flex-column gap-2 mt-2">
                    <label className="font-semibold text-900">Descripción</label>
                    <InputTextarea
                      {...editForm.register('description')}
                      rows={4}
                      className={classNames({
                        'p-invalid': editForm.formState.errors.description
                      })}
                    />
                    {editForm.formState.errors.description && (
                      <small className="p-error">
                        {editForm.formState.errors.description.message}
                      </small>
                    )}
                  </div>
                </TabPanel>

                <TabPanel header={tabHeader('Imágenes', 1)} className="flex flex-column gap-4">
                  <div className="flex flex-column gap-2 mt-2">
                    <label className="font-semibold text-900" htmlFor="images">
                      Imágenes del establecimiento
                    </label>
                    <Controller
                      control={editForm.control}
                      name="images"
                      render={({ field }) => (
                        <GalleryInput
                          key={String(detailQuery.data?.id ?? 'loading')}
                          id="images"
                          name={field.name}
                          initialImages={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                    {editForm.formState.errors.images && (
                      <small className="p-error">
                        {editForm.formState.errors.images?.message}
                      </small>
                    )}
                  </div>
                </TabPanel>

                <TabPanel header={tabHeader('Ubicación', 2)} className="flex flex-column gap-4">
                  <div className="flex flex-column gap-2 mt-2">
                    <label className="font-semibold text-900">Dirección</label>
                    <InputText
                      {...editForm.register('address')}
                      className={classNames({
                        'p-invalid': editForm.formState.errors.address
                      })}
                    />
                    {editForm.formState.errors.address && (
                      <small className="p-error">
                        {editForm.formState.errors.address.message}
                      </small>
                    )}
                  </div>

                  <div className="flex flex-column gap-2 mt-2">
                    <label className="font-semibold text-900">Parroquia</label>
                    <Controller
                      name="parish"
                      control={editForm.control}
                      render={({ field }) => (
                        <Dropdown
                          id={field.name}
                          value={field.value}
                          onChange={(e) => field.onChange(e.value)}
                          options={PARISH_OPTIONS as any}
                          optionLabel="label"
                          optionValue="value"
                          placeholder="Selecciona una parroquia"
                          className={classNames('w-full', {
                            'p-invalid': editForm.formState.errors.parish
                          })}
                        />
                      )}
                    />
                    {editForm.formState.errors.parish && (
                      <small className="p-error">
                        {editForm.formState.errors.parish.message}
                      </small>
                    )}
                  </div>

                  <div className="mt-3">
                    <MapLocationPicker
                      latitude={editForm.watch('latitude') ?? null}
                      longitude={editForm.watch('longitude') ?? null}
                      onChange={(lat, lng) => {
                        editForm.setValue('latitude', lat, {
                          shouldValidate: true
                        });
                        editForm.setValue('longitude', lng, {
                          shouldValidate: true
                        });
                      }}
                    />
                    {editForm.formState.errors.latitude && (
                      <small className="p-error">
                        {editForm.formState.errors.latitude.message}
                      </small>
                    )}
                  </div>
                </TabPanel>

                <TabPanel header={tabHeader('Horarios y Políticas', 3)} className="flex flex-column gap-4">
                  <div className="grid mt-2">
                    <div className="col-12 md:col-6 flex flex-column gap-2">
                      <label className="font-semibold text-900">
                        Hora de check-in
                      </label>
                      <InputText
                        type="time"
                        {...editForm.register('checkInTime')}
                        className={classNames({
                          'p-invalid': editForm.formState.errors.checkInTime
                        })}
                      />
                      {editForm.formState.errors.checkInTime && (
                        <small className="p-error">
                          {editForm.formState.errors.checkInTime.message}
                        </small>
                      )}
                    </div>
                    <div className="col-12 md:col-6 flex flex-column gap-2">
                      <label className="font-semibold text-900">
                        Hora de check-out
                      </label>
                      <InputText
                        type="time"
                        {...editForm.register('checkOutTime')}
                        className={classNames({
                          'p-invalid': editForm.formState.errors.checkOutTime
                        })}
                      />
                      {editForm.formState.errors.checkOutTime && (
                        <small className="p-error">
                          {editForm.formState.errors.checkOutTime.message}
                        </small>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-column gap-2 mt-3">
                    <label className="font-semibold text-900">
                      Política de pagos anticipados
                    </label>
                    <InputTextarea
                      {...editForm.register('advancePaymentPolicy')}
                      rows={3}
                      className={classNames({
                        'p-invalid': editForm.formState.errors.advancePaymentPolicy
                      })}
                    />
                    {editForm.formState.errors.advancePaymentPolicy && (
                      <small className="p-error">
                        {editForm.formState.errors.advancePaymentPolicy.message}
                      </small>
                    )}
                  </div>

                  <div className="flex flex-column gap-3 p-4 border-1 surface-border border-round mt-3 surface-50">
                    <span className="font-semibold text-900">
                      Configuración de política de cancelación
                    </span>

                    <div className="grid">
                      <div className="col-12 md:col-6 flex flex-column gap-2">
                        <label className="text-sm text-700">
                          ¿Desea aplicar penalización después de la hora
                          establecida?
                        </label>
                        <Dropdown
                          value={cancelPenaltyAfterEnabled ? 'SI' : 'NO'}
                          options={[
                            { label: 'Si', value: 'SI' },
                            { label: 'No', value: 'NO' }
                          ]}
                          onChange={(e) =>
                            editForm.setValue(
                              'cancelPenaltyAfterEnabled',
                              e.value === 'SI',
                              { shouldValidate: true }
                            )
                          }
                          className="w-full"
                        />
                      </div>

                      <div className="col-12 md:col-6 flex flex-column gap-2">
                        <label className="text-sm text-700">
                          Horas antes de la reserva para cancelar
                        </label>
                        <Controller
                          name="cancelPenaltyWindowHours"
                          control={editForm.control}
                          render={({ field }) => (
                            <Dropdown
                              value={field.value ?? 24}
                              options={[
                                { label: '24h', value: 24 },
                                { label: '48h', value: 48 },
                                { label: '72h', value: 72 }
                              ]}
                              onChange={(e) => field.onChange(e.value)}
                              disabled={!cancelPenaltyAfterEnabled}
                              className="w-full"
                            />
                          )}
                        />
                      </div>

                      <div className="col-12 flex flex-column gap-2 mt-2">
                        <label className="text-sm text-700">
                          Porcentaje de penalización después de la hora establecida
                        </label>
                        <Controller
                          name="cancelPenaltyAfterPercentage"
                          control={editForm.control}
                          render={({ field }) => (
                            <InputNumber
                              value={field.value ?? undefined}
                              onValueChange={(e) => field.onChange(e.value)}
                              disabled={!cancelPenaltyAfterEnabled}
                              min={1}
                              max={100}
                              suffix="%"
                              className={classNames('w-full', {
                                'p-invalid':
                                  editForm.formState.errors
                                    .cancelPenaltyAfterPercentage
                              })}
                            />
                          )}
                        />
                        {editForm.formState.errors.cancelPenaltyAfterPercentage && (
                          <small className="p-error">
                            {
                              editForm.formState.errors.cancelPenaltyAfterPercentage
                                .message
                            }
                          </small>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-column gap-2 mt-3">
                    <label className="font-semibold text-900">
                      Política de cancelación (autogenerada)
                    </label>
                    <InputTextarea
                      {...editForm.register('cancellationPolicy')}
                      rows={3}
                      readOnly
                      className="surface-200 opacity-80"
                    />
                  </div>

                  <div className="flex flex-column gap-2 mt-3">
                    <label className="font-semibold text-900">
                      Condiciones para estancias de niños
                    </label>
                    <InputTextarea
                      {...editForm.register('childrenPolicy')}
                      rows={3}
                      className={classNames({
                        'p-invalid': editForm.formState.errors.childrenPolicy
                      })}
                    />
                    {editForm.formState.errors.childrenPolicy && (
                      <small className="p-error">
                        {editForm.formState.errors.childrenPolicy.message}
                      </small>
                    )}
                  </div>

                  <div className="flex flex-column gap-2 mt-3">
                    <label className="font-semibold text-900">
                      Restricción por edad
                    </label>
                    <InputTextarea
                      {...editForm.register('ageRestrictionPolicy')}
                      rows={3}
                      className={classNames({
                        'p-invalid': editForm.formState.errors.ageRestrictionPolicy
                      })}
                    />
                    {editForm.formState.errors.ageRestrictionPolicy && (
                      <small className="p-error">
                        {editForm.formState.errors.ageRestrictionPolicy.message}
                      </small>
                    )}
                  </div>

                  <div className="flex flex-column gap-2 mt-3">
                    <label className="font-semibold text-900">
                      Política de mascotas
                    </label>
                    <InputTextarea
                      {...editForm.register('petsPolicy')}
                      rows={3}
                      className={classNames({
                        'p-invalid': editForm.formState.errors.petsPolicy
                      })}
                    />
                    {editForm.formState.errors.petsPolicy && (
                      <small className="p-error">
                        {editForm.formState.errors.petsPolicy.message}
                      </small>
                    )}
                  </div>

                  {/* ──── Otras políticas ──── */}
                  <div className="flex flex-column gap-3 mt-3 p-4 border-1 surface-border border-round surface-50">
                    <div className="flex align-items-center justify-content-between gap-2">
                      <span className="font-semibold text-900">Otras políticas del establecimiento</span>
                      <Button
                        type="button"
                        label="Añadir política"
                        icon="pi pi-plus"
                        size="small"
                        outlined
                        onClick={() => appendPolicy({ value: '' })}
                      />
                    </div>
                    <p className="text-sm text-500 m-0">
                      Agrega políticas personalizadas adicionales que apliquen al establecimiento.
                    </p>

                    {otherPoliciesFields.length === 0 && (
                      <p className="text-sm text-400 m-0 font-italic">Sin políticas adicionales configuradas.</p>
                    )}

                    <div className="flex flex-column gap-2">
                      {otherPoliciesFields.map((field, index) => (
                        <div key={field.id} className="flex align-items-start gap-2">
                          <div className="flex-1">
                            <InputText
                              {...editForm.register(`otherPolicies.${index}.value`)}
                              placeholder="Ej: No se permite fumar dentro del establecimiento"
                              className={classNames('w-full', {
                                'p-invalid': editForm.formState.errors.otherPolicies?.[index]?.value
                              })}
                            />
                            {editForm.formState.errors.otherPolicies?.[index]?.value && (
                              <small className="p-error">
                                {editForm.formState.errors.otherPolicies[index]?.value?.message}
                              </small>
                            )}
                          </div>
                          <Button
                            type="button"
                            icon="pi pi-times"
                            size="small"
                            severity="danger"
                            outlined
                            tooltip="Eliminar política"
                            tooltipOptions={{ position: 'top' }}
                            onClick={() => removePolicy(index)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </TabPanel>

                <TabPanel header={tabHeader('Métodos de pago', 4)} className="flex flex-column gap-4">
                  {/* ──────────── SECCIÓN: Transferencia Bancaria ──────────── */}
                  <div className="flex flex-column gap-3">
                    <div className="flex align-items-center justify-content-between gap-2">
                      <div className="flex align-items-center gap-2">
                        <i className="pi pi-building-columns text-primary text-xl"></i>
                        <span className="font-semibold text-900">
                          Datos para Transferencia Bancaria
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-600 m-0 mb-2">
                      Ingresa los datos de la cuenta bancaria del establecimiento
                      para que los clientes puedan realizar transferencias. Si no
                      configuras estos datos, la opción de transferencia no mostrará
                      información bancaria.
                    </p>

                    <div className="grid">
                      <div className="col-12 md:col-6 flex flex-column gap-2">
                        <label className="font-semibold text-900">Banco</label>
                        <InputText
                          placeholder="Ej. Banco Pichincha"
                          {...editForm.register('bankName')}
                          className="w-full"
                        />
                      </div>

                      <div className="col-12 md:col-6 flex flex-column gap-2">
                        <label className="font-semibold text-900">Tipo de cuenta</label>
                        <Controller
                          name="bankAccountType"
                          control={editForm.control}
                          render={({ field }) => (
                            <Dropdown
                              id={field.name}
                              value={field.value || null}
                              onChange={(e) => field.onChange(e.value)}
                              options={[
                                { label: 'Cuenta de Ahorros', value: 'Cuenta de Ahorros' },
                                { label: 'Cuenta Corriente', value: 'Cuenta Corriente' }
                              ]}
                              placeholder="Selecciona tipo de cuenta"
                              className="w-full"
                              showClear
                            />
                          )}
                        />
                      </div>

                      <div className="col-12 md:col-6 flex flex-column gap-2 mt-2">
                        <label className="font-semibold text-900">Número de cuenta</label>
                        <InputText
                          placeholder="Ej. 2200123456789"
                          {...editForm.register('bankAccountNumber')}
                          className="w-full"
                        />
                      </div>

                      <div className="col-12 md:col-6 flex flex-column gap-2 mt-2">
                        <label className="font-semibold text-900">Cédula / RUC del titular</label>
                        <InputText
                          placeholder="Ej. 0502000001"
                          {...editForm.register('bankAccountOwnerId')}
                          className="w-full"
                        />
                      </div>

                      <div className="col-12 md:col-6 flex flex-column gap-2 mt-2">
                        <label className="font-semibold text-900">Nombre del titular</label>
                        <InputText
                          placeholder="Nombre completo del titular"
                          {...editForm.register('bankAccountOwnerName')}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-top-1 surface-border my-3" />

                  {/* ──────────── SECCIÓN: PayPhone ──────────── */}
                  <div className="flex flex-column gap-3">
                    <div className="flex align-items-center justify-content-between gap-2">
                      <div className="flex align-items-center gap-2">
                        <i className="pi pi-credit-card text-primary text-xl"></i>
                        <span className="font-semibold text-900">
                          Pasarela de Pagos (PayPhone)
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-600 m-0 mb-2">
                      Configura las credenciales de tu comercio de PayPhone para
                      habilitar de forma automática el cobro de reservas con
                      tarjetas de crédito o débito en la plataforma.
                    </p>

                    <div className="grid">
                      <div className="col-12 flex flex-column gap-2">
                        <label className="font-semibold text-900">
                          Token de Producción (PayPhone Token)
                        </label>
                        <InputText
                          type="password"
                          placeholder="Ingrese el token Auth Bearer de su comercio"
                          {...editForm.register('payphoneToken')}
                          className={classNames('w-full', {
                            'p-invalid': editForm.formState.errors.payphoneToken
                          })}
                        />
                        {editForm.formState.errors.payphoneToken && (
                          <small className="p-error">
                            {editForm.formState.errors.payphoneToken.message}
                          </small>
                        )}
                      </div>

                      <div className="col-12 flex flex-column gap-2 mt-2">
                        <label className="font-semibold text-900">
                          ID de la Tienda (Store ID)
                        </label>
                        <InputText
                          placeholder="Ej. 1234abcd-1234-abcd-1234-abcd1234abcd"
                          {...editForm.register('payphoneStoreId')}
                          className={classNames('w-full', {
                            'p-invalid': editForm.formState.errors.payphoneStoreId
                          })}
                        />
                        {editForm.formState.errors.payphoneStoreId && (
                          <small className="p-error">
                            {editForm.formState.errors.payphoneStoreId.message}
                          </small>
                        )}
                      </div>
                    </div>
                  </div>
                </TabPanel>
              </TabView>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
