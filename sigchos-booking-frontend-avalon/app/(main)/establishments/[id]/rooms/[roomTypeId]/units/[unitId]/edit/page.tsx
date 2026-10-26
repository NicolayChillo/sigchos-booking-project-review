'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useRouter, useParams } from 'next/navigation';
import { z } from 'zod';
import { useAuth } from '@/lib/auth/AuthContext';
import { getApiErrorMessage } from '@/lib/http/getApiErrorMessage';
import { getEstablishmentById } from '@/modules/establishments/api/establishmentsApi';
import { getRoomTypeById } from '@/modules/rooms/api/roomTypesApi';
import { getRoomUnitById, updateRoomUnitInRoomType } from '@/modules/rooms/api/roomUnitsApi';

import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';

const editSchema = z.object({
  code: z.string().trim().min(1, 'Mínimo 1 carácter.').max(20, 'Máximo 20 caracteres.'),
});

type EditFormValues = z.infer<typeof editSchema>;

export default function RoomUnitEditPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const establishmentId = Number(params.id);
  const roomTypeId = Number(params.roomTypeId);
  const unitId = Number(params.unitId);
  const toast = useRef<Toast>(null);
    const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const canAccess = user?.role === 'ESTABLISHMENT_ADMIN';

  const estQuery = useQuery({ queryKey: ['establishment', establishmentId], queryFn: () => getEstablishmentById(establishmentId), enabled: Number.isFinite(establishmentId) && canAccess && mounted });
  const rtQuery = useQuery({ queryKey: ['room-type', roomTypeId], queryFn: () => getRoomTypeById(roomTypeId), enabled: Number.isFinite(roomTypeId) && canAccess && mounted });
  const unitQuery = useQuery({ queryKey: ['room-unit', unitId], queryFn: () => getRoomUnitById(unitId), enabled: Number.isFinite(unitId) && canAccess && mounted });

  const isOwnerViolation = user?.role === 'ESTABLISHMENT_ADMIN' && estQuery.data && estQuery.data.userId !== user?.id;
  const isRoomTypeMismatch = rtQuery.data && rtQuery.data.establishmentId !== establishmentId;
  const isUnitMismatch = unitQuery.data && unitQuery.data.roomTypeId !== roomTypeId;

  const form = useForm<EditFormValues>({ resolver: zodResolver(editSchema), defaultValues: { code: '' } });

  useEffect(() => {
    if (!unitQuery.data) return;
    form.reset({ code: unitQuery.data.code });
  }, [form, unitQuery.data]);

  const updateMut = useMutation({
    mutationFn: (p: EditFormValues) => updateRoomUnitInRoomType(roomTypeId, unitId, { code: p.code }),
    onSuccess: () => { router.push(`/establishments/${establishmentId}/rooms/${roomTypeId}/units`); },
    onError: (err: any) => { toast.current?.show({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(err, 'No se pudo actualizar la habitación.'), life: 5000 }); },
  });

  const onSubmit = form.handleSubmit((v) => { updateMut.mutate(v); });

  if (!mounted) return null;
  if (!canAccess) return <div className="card"><Message severity="error" text="No tienes permisos para editar habitaciones." className="w-full justify-content-start" /></div>;

  return (
    <div className="flex flex-column gap-3">
      <Toast ref={toast} />
      <div className="card flex flex-column gap-3">
        <div>
          <h2 className="m-0 text-900">Editar habitación</h2>
          <p className="mt-2 mb-0 text-600">Tipo: {rtQuery.data?.name ?? 'Cargando...'}</p>
        </div>
        <div><Button label="Volver a habitaciones" icon="pi pi-arrow-left" outlined severity="secondary" onClick={() => router.push(`/establishments/${establishmentId}/rooms/${roomTypeId}/units`)} /></div>
      </div>

      {unitQuery.isLoading && <p className="text-600">Cargando habitación...</p>}
      {unitQuery.isError && <Message severity="error" text={getApiErrorMessage(unitQuery.error, 'No se pudo cargar la habitación.')} className="w-full justify-content-start" />}
      {isOwnerViolation && <Message severity="error" text="No puedes editar habitaciones de un establecimiento que no te pertenece." className="w-full justify-content-start" />}
      {isRoomTypeMismatch && <Message severity="error" text="El tipo de habitación no pertenece al establecimiento seleccionado." className="w-full justify-content-start" />}
      {isUnitMismatch && <Message severity="error" text="La habitación no corresponde al tipo seleccionado." className="w-full justify-content-start" />}

      {unitQuery.data && !isOwnerViolation && !isRoomTypeMismatch && !isUnitMismatch && (
        <div className="card">
          <form onSubmit={onSubmit} className="flex flex-column gap-4 max-w-30rem">
            <div className="flex flex-column gap-2">
              <label className="font-semibold text-900">Código</label>
              <InputText {...form.register('code')} className={classNames({ 'p-invalid': form.formState.errors.code })} />
              {form.formState.errors.code && <small className="p-error">{form.formState.errors.code.message}</small>}
            </div>
            <Button type="submit" label="Guardar cambios" icon="pi pi-save" loading={updateMut.isPending} className="w-full md:w-auto" />
          </form>
        </div>
      )}
    </div>
  );
}
