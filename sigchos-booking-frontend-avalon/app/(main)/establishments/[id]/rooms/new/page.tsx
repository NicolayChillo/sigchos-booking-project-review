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
import { createRoomTypeInEstablishment } from '@/modules/rooms/api/roomTypesApi';
import {
  ROOM_AMENITY_GROUPS,
  ROOM_BED_TYPE_OPTIONS,
  ROOM_CATEGORY_OPTIONS,
  type RoomAmenity
} from '@/modules/rooms/types';

import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Toast } from 'primereact/toast';
import { Checkbox } from 'primereact/checkbox';
import { classNames } from 'primereact/utils';
import { GalleryInput } from '@/modules/shared/components/GalleryInput';

const ROOM_AMENITY_VALUES = [
  'AIR_CONDITIONING_OR_HEATING',
  'FAN',
  'TV_SMART_OR_CABLE',
  'IN_ROOM_WIFI',
  'SHOWER_OR_BATHTUB',
  'HOT_WATER',
  'HAIR_DRYER',
  'COFFEE_OR_TEA_MAKER',
  'MINIBAR_OR_REFRIGERATOR',
  'MICROWAVE',
  'SAFE_BOX',
  'JACUZZI',
  'DIRECT_ROOM_SERVICE',
  'SPEAKERS'
] as const;

const createSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, 'Mínimo 3 caracteres.')
      .max(50, 'Máximo 50 caracteres.'),
    description: z
      .string()
      .trim()
      .min(3, 'Mínimo 3 caracteres.')
      .max(100, 'Máximo 100 caracteres.'),
    images: z.array(
      z.object({
        id: z.number(),
        file: z.file().mime(['image/jpeg', 'image/png', 'image/webp']),
        url: z.string(),
        isPrimary: z.boolean(),
        isNew: z.boolean()
      })
    ),
    category: z.enum([
      'HOTEL_ROOM',
      'HOSTEL_BED',
      'APARTMENT',
      'VILLA',
      'GLAMPING_UNIT'
    ]),
    capacity: z
      .string()
      .trim()
      .regex(/^\d+$/, 'Debe ser entero positivo.')
      .refine((v) => Number(v) > 0, 'Debe ser mayor a 0.'),
    bedCount: z
      .string()
      .trim()
      .regex(/^\d+$/, 'Debe ser entero positivo.')
      .refine((v) => Number(v) > 0, 'Debe ser mayor a 0.'),
    bedType: z.enum(['BUNK', 'SINGLE', 'DOUBLE', 'QUEEN', 'KING', 'SOFA_BED']),
    amenities: z.array(z.enum(ROOM_AMENITY_VALUES)).max(14),
    pricePerNight: z
      .string()
      .trim()
      .regex(/^\d+(\.\d{1,2})?$/, 'Formato válido: 0 o 12.50')
      .refine((v) => Number(v) > 0, 'Debe ser mayor a 0.'),
    requiresAdvancePayment: z.enum(['YES', 'NO']),
    advancePaymentPercentage: z.string().trim().optional()
  })
  .superRefine((values, ctx) => {
    if (values.requiresAdvancePayment === 'NO') return;
    const raw = values.advancePaymentPercentage?.trim() ?? '';
    if (raw.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Ingresa un porcentaje de anticipo.',
        path: ['advancePaymentPercentage']
      });
      return;
    }
    if (!/^\d+$/.test(raw)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debe ser entero.',
        path: ['advancePaymentPercentage']
      });
      return;
    }
    const n = Number(raw);
    if (n < 1 || n > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debe estar entre 1 y 100.',
        path: ['advancePaymentPercentage']
      });
    }
  });

type CreateFormValues = z.infer<typeof createSchema>;

export default function RoomCreatePage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const establishmentId = Number(params.id);
  const toast = useRef<Toast>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const canAccess = user?.role === 'ESTABLISHMENT_ADMIN';

  const estQuery = useQuery({
    queryKey: ['establishment', establishmentId],
    queryFn: () => getEstablishmentById(establishmentId),
    enabled: Number.isFinite(establishmentId) && canAccess && mounted
  });

  const isOwnerViolation =
    user?.role === 'ESTABLISHMENT_ADMIN' &&
    estQuery.data &&
    estQuery.data.userId !== user?.id;

  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      name: '',
      description: '',
      category: 'HOTEL_ROOM',
      capacity: '1',
      bedCount: '1',
      bedType: 'SINGLE',
      amenities: [],
      pricePerNight: '1.00',
      requiresAdvancePayment: 'NO',
      advancePaymentPercentage: '',
      images: []
    }
  });

  const requiresAdvancePayment = form.watch('requiresAdvancePayment');
  const selectedAmenities = form.watch('amenities');

  function handleAmenityToggle(amenity: RoomAmenity, checked: boolean) {
    const current = form.getValues('amenities') ?? [];
    const next = checked
      ? Array.from(new Set([...current, amenity]))
      : current.filter((i) => i !== amenity);
    form.setValue('amenities', next, {
      shouldDirty: true,
      shouldValidate: true
    });
  }

  const createMut = useMutation({
    mutationFn: (p: CreateFormValues) =>
      createRoomTypeInEstablishment(establishmentId, {
        name: p.name,
        description: p.description,
        images: p.images.map((img) => ({
          file: img.file,
          isPrimary: img.isPrimary
        })),
        category: p.category,
        capacity: Number(p.capacity),
        bedCount: Number(p.bedCount),
        bedType: p.bedType,
        amenities: p.amenities,
        pricePerNight: Number(p.pricePerNight),
        requiresAdvancePayment: p.requiresAdvancePayment === 'YES',
        advancePaymentPercentage:
          p.requiresAdvancePayment === 'YES'
            ? Number(p.advancePaymentPercentage)
            : null
      }),
    onSuccess: () => {
      router.push(`/establishments/${establishmentId}/rooms`);
    },
    onError: (error: any) => {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: getApiErrorMessage(
          error,
          'No se pudo crear el tipo de habitación.'
        ),
        life: 5000
      });
    }
  });

  const onSubmit = form.handleSubmit((v) => {
    createMut.mutate(v);
  });

  if (!mounted) return null;
  if (!canAccess)
    return (
      <div className="card">
        <Message
          severity="error"
          text="No tienes permisos para crear tipos de habitación."
          className="w-full justify-content-start"
        />
      </div>
    );

  return (
    <div className="flex flex-column gap-3">
      <Toast ref={toast} />

      <div className="card flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center gap-3">
        <div>
          <h2 className="m-0 text-900">Añadir tipo de habitación</h2>
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
            onClick={() =>
              router.push(`/establishments/${establishmentId}/rooms`)
            }
            className="w-full md:w-auto"
          />
          <Button
            type="submit"
            form="new-room-form"
            label="Crear tipo de habitación"
            icon="pi pi-check"
            loading={createMut.isPending}
            className="w-full md:w-auto"
          />
        </div>
      </div>

      {isOwnerViolation && (
        <Message
          severity="error"
          text="No puedes crear habitaciones en un establecimiento que no te pertenece."
          className="w-full justify-content-start"
        />
      )}

      {!isOwnerViolation && (
        <div className="card">
          <form
            id="new-room-form"
            onSubmit={onSubmit}
            className="flex flex-column gap-4"
          >
            <div className="grid">
              <div className="col-12 md:col-6 flex flex-column gap-2">
                <label className="font-semibold text-900">Nombre de la habitación</label>
                <InputText
                  {...form.register('name')}
                  placeholder="Ej: Habitación Matrimonial"
                  className={classNames({
                    'p-invalid': form.formState.errors.name
                  })}
                />
                {form.formState.errors.name && (
                  <small className="p-error">
                    {form.formState.errors.name.message}
                  </small>
                )}
              </div>

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
                      options={ROOM_CATEGORY_OPTIONS as any}
                      optionLabel="label"
                      optionValue="value"
                      className="w-full"
                    />
                  )}
                />
              </div>

              <div className="col-12 flex flex-column gap-2 mt-2">
                <label className="font-semibold text-900">Descripción</label>
                <InputTextarea
                  {...form.register('description')}
                  rows={4}
                  placeholder="Describe qué hace especial a esta habitación..."
                  className={classNames({
                    'p-invalid': form.formState.errors.description
                  })}
                />
                {form.formState.errors.description && (
                  <small className="p-error">
                    {form.formState.errors.description.message}
                  </small>
                )}
              </div>

              <div className="col-12 flex flex-column gap-2 mt-2">
                <label htmlFor="images" className="font-semibold text-900">
                  Imágenes de la habitación
                </label>
                <Controller
                  control={form.control}
                  name="images"
                  render={({ field }) => (
                    <GalleryInput
                      id="images"
                      name={field.name}
                      initialImages={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>

              <div className="col-12 md:col-4 flex flex-column gap-2 mt-3">
                <label className="font-semibold text-900">Capacidad (Personas)</label>
                <InputText
                  {...form.register('capacity')}
                  placeholder="Ej: 2"
                  className={classNames({
                    'p-invalid': form.formState.errors.capacity
                  })}
                />
                {form.formState.errors.capacity && (
                  <small className="p-error">
                    {form.formState.errors.capacity.message}
                  </small>
                )}
              </div>

              <div className="col-12 md:col-4 flex flex-column gap-2 mt-3">
                <label className="font-semibold text-900">
                  Número de camas
                </label>
                <InputText
                  {...form.register('bedCount')}
                  placeholder="Ej: 1"
                  className={classNames({
                    'p-invalid': form.formState.errors.bedCount
                  })}
                />
                {form.formState.errors.bedCount && (
                  <small className="p-error">
                    {form.formState.errors.bedCount.message}
                  </small>
                )}
              </div>

              <div className="col-12 md:col-4 flex flex-column gap-2 mt-3">
                <label className="font-semibold text-900">Tipo de cama principal</label>
                <Controller
                  name="bedType"
                  control={form.control}
                  render={({ field }) => (
                    <Dropdown
                      id={field.name}
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      options={ROOM_BED_TYPE_OPTIONS as any}
                      optionLabel="label"
                      optionValue="value"
                      className="w-full"
                    />
                  )}
                />
              </div>

              <div className="col-12 flex flex-column gap-3 mt-4">
                <span className="font-semibold text-900 text-lg border-bottom-1 surface-border pb-2">
                  Servicios propios de la habitación
                </span>
                <div className="grid">
                  {ROOM_AMENITY_GROUPS.map((group) => (
                    <div key={group.key} className="col-12 lg:col-6">
                      <div className="p-4 border-1 surface-border border-round h-full surface-card hover:shadow-1 transition-all transition-duration-200">
                        <span className="font-semibold text-800 mb-3 block text-primary">
                          {group.label}
                        </span>
                        <div className="grid">
                          {group.options.map((option) => {
                            const checked = selectedAmenities.includes(
                              option.value
                            );
                            return (
                              <div
                                key={option.value}
                                className="col-12 sm:col-6 flex align-items-center gap-2 mb-2"
                              >
                                <Checkbox
                                  inputId={option.value}
                                  checked={checked}
                                  onChange={(e) =>
                                    handleAmenityToggle(
                                      option.value,
                                      e.checked ?? false
                                    )
                                  }
                                />
                                <label
                                  htmlFor={option.value}
                                  className="text-700 hover:text-900 transition-colors text-sm cursor-pointer"
                                >
                                  {option.label}
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="col-12 md:col-4 flex flex-column gap-2 mt-4">
                <label className="font-semibold text-900">Precio por noche (USD)</label>
                <InputText
                  {...form.register('pricePerNight')}
                  placeholder="Ej: 45.00"
                  className={classNames({
                    'p-invalid': form.formState.errors.pricePerNight
                  })}
                />
                {form.formState.errors.pricePerNight && (
                  <small className="p-error">
                    {form.formState.errors.pricePerNight.message}
                  </small>
                )}
              </div>

              <div className="col-12 md:col-4 flex flex-column gap-2 mt-4">
                <label className="font-semibold text-900">
                  Requiere pago anticipado
                </label>
                <Controller
                  name="requiresAdvancePayment"
                  control={form.control}
                  render={({ field }) => (
                    <Dropdown
                      id={field.name}
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      options={[
                        { label: 'No', value: 'NO' },
                        { label: 'Sí, requiere anticipo', value: 'YES' }
                      ]}
                      className="w-full"
                    />
                  )}
                />
              </div>

              {requiresAdvancePayment === 'YES' && (
                <div className="col-12 md:col-4 flex flex-column gap-2 mt-4">
                  <label className="font-semibold text-900">
                    Porcentaje de anticipo (%)
                  </label>
                  <InputText
                    {...form.register('advancePaymentPercentage')}
                    placeholder="Ej: 30"
                    type="number"
                    min={1}
                    max={100}
                    className={classNames({
                      'p-invalid': form.formState.errors.advancePaymentPercentage
                    })}
                  />
                  {form.formState.errors.advancePaymentPercentage && (
                    <small className="p-error">
                      {form.formState.errors.advancePaymentPercentage.message}
                    </small>
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
