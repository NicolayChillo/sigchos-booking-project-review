'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { getApiErrorMessage } from '@/lib/http/getApiErrorMessage';
import { getEstablishmentById } from '@/modules/establishments/api/establishmentsApi';
import { deleteServiceInEstablishment, listServicesByEstablishment, restoreServiceInEstablishment } from '@/modules/services/api/servicesApi';
import { SERVICE_CATEGORIES } from '@/modules/services/types';

import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';

function getCategoryLabel(cat: string) {
  return SERVICE_CATEGORIES.find((c) => c.value === cat)?.label ?? cat;
}

export default function EstablishmentServicesPage() {
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

  const servicesQuery = useQuery({
    queryKey: ['services', establishmentId],
    queryFn: () => listServicesByEstablishment(establishmentId),
    enabled: canFetch,
  });

  const services = servicesQuery.data ?? [];

  const deleteMut = useMutation({
    mutationFn: (serviceId: number) => deleteServiceInEstablishment(establishmentId, serviceId),
    onSuccess: () => {
      toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Servicio desactivado.', life: 3000 });
      queryClient.invalidateQueries({ queryKey: ['services', establishmentId] });
    },
    onError: (error: any) => {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error, 'No se pudo desactivar.'), life: 5000 });
    },
  });

  const restoreMut = useMutation({
    mutationFn: (serviceId: number) => restoreServiceInEstablishment(establishmentId, serviceId),
    onSuccess: () => {
      toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Servicio restaurado.', life: 3000 });
      queryClient.invalidateQueries({ queryKey: ['services', establishmentId] });
    },
    onError: (error: any) => {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error, 'No se pudo restaurar.'), life: 5000 });
    },
  });

  const isOwnerViolation = user?.role === 'ESTABLISHMENT_ADMIN' && estQuery.data && estQuery.data.userId !== user?.id;

  if (!mounted) return null;

  if (!canAccess) {
    return <div className="card"><Message severity="error" text="No tienes permisos para visualizar los servicios." className="w-full justify-content-start" /></div>;
  }

  return (
    <div className="flex flex-column gap-3">
      <Toast ref={toast} />

      <div className="card flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center gap-3">
        <div>
          <h2 className="m-0 text-900">{estQuery.data?.name ?? 'Cargando...'}</h2>
          <p className="mt-2 mb-0 text-600">Gestiona los servicios asociados al alojamiento.</p>
        </div>
        <div className="flex gap-2">
          <Button label="Añadir servicio" icon="pi pi-plus" onClick={() => router.push(`/establishments/${establishmentId}/services/new`)} />
          <Button label="Volver a detalles" icon="pi pi-arrow-left" outlined severity="secondary" onClick={() => router.push(`/establishments/${establishmentId}`)} />
        </div>
      </div>

      {isOwnerViolation && <Message severity="error" text="No puedes administrar servicios de un establecimiento que no te pertenece." className="w-full justify-content-start" />}

      {!isOwnerViolation && (
        <div className="card">
          <div className="flex justify-content-between align-items-center border-bottom-1 surface-border pb-3 mb-4">
            <h3 className="m-0 text-900 text-xl">Listado de servicios</h3>
            <span className="text-600 text-sm">{services.length} registros</span>
          </div>

          {servicesQuery.isLoading && <p className="text-600">Cargando servicios...</p>}
          {servicesQuery.isError && <Message severity="error" text={getApiErrorMessage(servicesQuery.error, 'No se pudo cargar los servicios.')} className="w-full justify-content-start mb-3" />}

          <div className="flex flex-column gap-3">
            {services.map((item: any) => (
              <div key={item.id} className="border-1 surface-border border-round p-4 flex flex-column md:flex-row justify-content-between align-items-start gap-3">
                <div className="flex-1">
                  <div className="flex align-items-center gap-2 mb-2">
                    <span className="font-semibold text-900 text-lg">{item.name}</span>
                    <Tag severity={item.isActive ? 'success' : 'danger'} value={item.isActive ? 'Activo' : 'Inactivo'} />
                  </div>
                  <div className="text-500 text-sm mb-1">Categoría: {getCategoryLabel(item.category)}</div>
                  <div className="text-700 mb-1">{item.description}</div>
                  <div className="text-700 text-sm">{item.hasAdditionalCost ? `Costo adicional: $${Number(item.additionalCost).toFixed(2)}` : 'Sin costo extra'}</div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button label="Editar" icon="pi pi-pencil" outlined size="small" onClick={() => router.push(`/establishments/${establishmentId}/services/${item.id}/edit`)} />
                  {item.isActive ? (
                    <Button label="Desactivar" icon="pi pi-ban" outlined severity="danger" size="small" onClick={() => deleteMut.mutate(item.id)} loading={deleteMut.isPending} />
                  ) : (
                    <Button label="Restaurar" icon="pi pi-refresh" outlined severity="success" size="small" onClick={() => restoreMut.mutate(item.id)} loading={restoreMut.isPending} />
                  )}
                </div>
              </div>
            ))}

            {!servicesQuery.isLoading && services.length === 0 && (
              <div className="surface-100 p-4 border-round border-1 surface-border text-center">
                <p className="text-600 mb-3">No hay servicios registrados todavía.</p>
                <Button label="Añadir servicio" icon="pi pi-plus" outlined onClick={() => router.push(`/establishments/${establishmentId}/services/new`)} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
