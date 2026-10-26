'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { getApiErrorMessage } from '@/lib/http/getApiErrorMessage';
import { getEstablishmentById } from '@/modules/establishments/api/establishmentsApi';
import { deleteRoomType, listRoomTypesByEstablishment, restoreRoomType } from '@/modules/rooms/api/roomTypesApi';
import { ROOM_AMENITY_GROUPS, ROOM_BED_TYPE_OPTIONS, type RoomAmenity, type RoomBedType } from '@/modules/rooms/types';

import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';

function getBedTypeLabel(bedType: RoomBedType): string { return ROOM_BED_TYPE_OPTIONS.find((i) => i.value === bedType)?.label ?? bedType; }
function getAmenityLabel(amenity: RoomAmenity): string { for (const g of ROOM_AMENITY_GROUPS) { const m = g.options.find((o) => o.value === amenity); if (m) return m.label; } return amenity; }

export default function EstablishmentRoomsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useParams();
  const establishmentId = Number(params.id);
  const toast = useRef<Toast>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const canAccess = user?.role === 'ESTABLISHMENT_ADMIN';

  const estQuery = useQuery({
    queryKey: ['establishment', establishmentId],
    queryFn: () => getEstablishmentById(establishmentId),
    enabled: Number.isFinite(establishmentId) && canAccess && mounted,
  });

  const canFetch = Number.isFinite(establishmentId) && canAccess && estQuery.data?.userId === user?.id && mounted;

  const roomsQuery = useQuery({
    queryKey: ['room-types', establishmentId],
    queryFn: () => listRoomTypesByEstablishment(establishmentId, 'ALL'),
    enabled: canFetch,
  });

  const roomTypes = roomsQuery.data ?? [];

  const deleteMut = useMutation({
    mutationFn: (roomTypeId: number) => deleteRoomType(roomTypeId),
    onSuccess: () => { toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Tipo de habitación desactivado.', life: 3000 }); queryClient.invalidateQueries({ queryKey: ['room-types', establishmentId] }); },
    onError: (error: any) => { toast.current?.show({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error, 'No se pudo desactivar.'), life: 5000 }); },
  });

  const restoreMut = useMutation({
    mutationFn: (roomTypeId: number) => restoreRoomType(roomTypeId),
    onSuccess: () => { toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Tipo de habitación restaurado.', life: 3000 }); queryClient.invalidateQueries({ queryKey: ['room-types', establishmentId] }); },
    onError: (error: any) => { toast.current?.show({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error, 'No se pudo restaurar.'), life: 5000 }); },
  });

  const isOwnerViolation = user?.role === 'ESTABLISHMENT_ADMIN' && estQuery.data && estQuery.data.userId !== user?.id;

  if (!mounted) return null;
  if (!canAccess) return <div className="card"><Message severity="error" text="No tienes permisos para visualizar habitaciones." className="w-full justify-content-start" /></div>;

  return (
    <div className="flex flex-column gap-3">
      <Toast ref={toast} />

      <div className="card flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center gap-3">
        <div>
          <h2 className="m-0 text-900">{estQuery.data?.name ?? 'Cargando...'}</h2>
          <p className="mt-2 mb-0 text-600">Gestiona los tipos de habitación y sus unidades.</p>
        </div>
        <div className="flex gap-2">
          <Button label="Añadir tipo de habitación" icon="pi pi-plus" onClick={() => router.push(`/establishments/${establishmentId}/rooms/new`)} />
          <Button label="Volver a detalles" icon="pi pi-arrow-left" outlined severity="secondary" onClick={() => router.push(`/establishments/${establishmentId}`)} />
        </div>
      </div>

      {isOwnerViolation && <Message severity="error" text="No puedes administrar habitaciones de un establecimiento que no te pertenece." className="w-full justify-content-start" />}

      {!isOwnerViolation && (
        <div className="card">
          <div className="flex justify-content-between align-items-center border-bottom-1 surface-border pb-3 mb-4">
            <h3 className="m-0 text-900 text-xl">Tipos de habitación</h3>
            <span className="text-600 text-sm">{roomTypes.length} registros</span>
          </div>

          {roomsQuery.isLoading && <p className="text-600">Cargando tipos de habitación...</p>}
          {roomsQuery.isError && <Message severity="error" text={getApiErrorMessage(roomsQuery.error, 'No se pudo cargar los tipos de habitación.')} className="w-full justify-content-start mb-3" />}

          <div className="flex flex-column gap-3">
            {roomTypes.map((item: any) => (
              <div key={item.id} className="border-1 surface-border border-round p-4">
                <div className="flex flex-column md:flex-row justify-content-between align-items-start gap-3">
                  <div className="flex-1">
                    <div className="flex align-items-center gap-2 mb-2">
                      <span className="font-semibold text-900 text-lg">{item.name}</span>
                      <Tag severity={item.isActive ? 'success' : 'danger'} value={item.isActive ? 'Activo' : 'Inactivo'} />
                    </div>
                    <div className="text-700 mb-2">{item.description}</div>
                    <div className="text-700 text-sm mb-1"><span className="font-medium">Capacidad:</span> {item.capacity} · <span className="font-medium">Precio:</span> ${Number(item.pricePerNight).toFixed(2)}/noche</div>
                    <div className="text-700 text-sm mb-1"><span className="font-medium">Camas:</span> {item.bedCount} ({getBedTypeLabel(item.bedType)})</div>
                    <div className="text-700 text-sm mb-1"><span className="font-medium">Servicios propios:</span> {item.amenities.length > 0 ? item.amenities.map((a: any) => getAmenityLabel(a)).join(', ') : 'Ninguno'}</div>
                    <div className="text-700 text-sm"><span className="font-medium">Anticipo:</span> {item.requiresAdvancePayment ? `${item.advancePaymentPercentage}% (requerido)` : 'No requerido'}</div>
                  </div>
                  <div className="flex flex-column gap-2 flex-shrink-0">
                    <Button label="Editar" icon="pi pi-pencil" outlined size="small" onClick={() => router.push(`/establishments/${establishmentId}/rooms/${item.id}/edit`)} />
                    <Button label="Habitaciones" icon="pi pi-list" outlined size="small" severity="info" onClick={() => router.push(`/establishments/${establishmentId}/rooms/${item.id}/units`)} />
                    {item.isActive ? (
                      <Button label="Desactivar" icon="pi pi-ban" outlined severity="danger" size="small" onClick={() => deleteMut.mutate(item.id)} loading={deleteMut.isPending} />
                    ) : (
                      <Button label="Restaurar" icon="pi pi-refresh" outlined severity="success" size="small" onClick={() => restoreMut.mutate(item.id)} loading={restoreMut.isPending} />
                    )}
                  </div>
                </div>
              </div>
            ))}

            {!roomsQuery.isLoading && roomTypes.length === 0 && (
              <div className="surface-100 p-4 border-round border-1 surface-border text-center">
                <p className="text-600 mb-3">No hay tipos de habitación registrados todavía.</p>
                <Button label="Añadir tipo de habitación" icon="pi pi-plus" outlined onClick={() => router.push(`/establishments/${establishmentId}/rooms/new`)} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
