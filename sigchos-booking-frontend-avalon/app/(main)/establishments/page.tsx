'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { getApiErrorMessage } from '@/lib/http/getApiErrorMessage';
import { deleteEstablishment, listEstablishments, restoreEstablishment } from '@/modules/establishments/api/establishmentsApi';
import { isEstablishmentIncomplete } from '@/modules/establishments/utils/establishmentUtils';
import { EstablishmentRequestStatusFilter } from '@/modules/establishmentRequests/enum/EstablishmentRequestStatusFilter';
import { useEstablishmentRequestList } from '@/modules/establishmentRequests/hooks/useEstablishmentRequestList';
import { useEstablishmentRequestMutation } from '@/modules/establishmentRequests/hooks/useEstablishmentRequestMutation';
import { EstablishmentRequestCard } from '@/modules/establishmentRequests/components/EstablishmentRequestCard';
import { EstablishmentRequestStatusFilterSelect } from '@/modules/establishmentRequests/components/EstablismentRequestStatusFilterSelect';

import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';

export default function EstablishmentsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { user } = useAuth();
  const toast = useRef<Toast>(null);
  const [requestFilter, setRequestFilter] = useState<EstablishmentRequestStatusFilter>(EstablishmentRequestStatusFilter.PENDING);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const canAccessEstablishments = user?.role === 'ESTABLISHMENT_ADMIN';

  const establishmentsQuery = useQuery({
    queryKey: ['establishments'],
    queryFn: listEstablishments,
    enabled: canAccessEstablishments && mounted
  });

  const establishments = establishmentsQuery.data ?? [];

  const deleteMutation = useMutation({
    mutationFn: deleteEstablishment,
    onSuccess: () => {
      toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Establecimiento desactivado correctamente.', life: 3000 });
      queryClient.invalidateQueries({ queryKey: ['establishments'] });
    },
    onError: (error) => {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error, 'No se pudo desactivar el establecimiento.'), life: 5000 });
    }
  });

  const restoreMutation = useMutation({
    mutationFn: restoreEstablishment,
    onSuccess: () => {
      toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Establecimiento restaurado correctamente.', life: 3000 });
      queryClient.invalidateQueries({ queryKey: ['establishments'] });
    },
    onError: (error) => {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error, 'No se pudo restaurar el establecimiento.'), life: 5000 });
    }
  });

  const {
    data: requestsData,
    isPending: isRequestsQueryPending,
    error: requestsQueryError
  } = useEstablishmentRequestList({
    filter: requestFilter
  });

  const { review, isMutationPending, mutationError } = useEstablishmentRequestMutation();
  const [requestReviewedId, setRequestReviewedId] = useState<number | null>(null);

  const handleReview = async (id: number, dto: any) => {
    setRequestReviewedId(id);
    try {
      await review({ id, dto });
      toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Solicitud procesada correctamente.', life: 3000 });
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: err.message || 'No se pudo procesar la solicitud.', life: 5000 });
    }
  };

  if (!mounted) {
    return null;
  }

  if (!canAccessEstablishments) {
    return (
      <div className="card">
        <Message severity="error" text="No tienes permisos para visualizar Establishments." className="w-full justify-content-start" />
      </div>
    );
  }

  return (
    <div className="flex flex-column gap-3">
      <Toast ref={toast} />
      <div className="card flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center gap-3">
        <div>
          <h2 className="m-0 text-900">Panel de gestión de establecimientos</h2>
          <p className="mt-2 mb-0 text-600">Listado general con acciones de gestión para crear, editar y administrar servicios.</p>
        </div>
        <Button label="Crear nuevo establecimiento" icon="pi pi-plus" onClick={() => router.push('/establishments/new')} />
      </div>

      {(isRequestsQueryPending || requestsQueryError || (requestsData && requestsData.length > 0)) && (
        <div className="card">
          <div className="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center mb-4 border-bottom-1 surface-border pb-3">
            <div>
              <h4 className="m-0 text-900">Solicitudes de establecimientos</h4>
              <p className="mt-1 mb-0 text-600">Solicitudes pendientes de aprobación</p>
            </div>
            <EstablishmentRequestStatusFilterSelect id="request-status-filter" name="request-status-filter" value={requestFilter} onChange={setRequestFilter} />
          </div>

          {requestsQueryError ? (
            <Message severity="error" text={requestsQueryError.message} className="w-full justify-content-start" />
          ) : isRequestsQueryPending ? (
            <p className="text-600">Cargando solicitudes...</p>
          ) : (
            <div className="flex flex-column gap-3">
              {requestsData?.map((request: any) => (
                <EstablishmentRequestCard key={request.id} data={request} role={user?.role} onReview={handleReview} loading={request.id === requestReviewedId && isMutationPending} error={request.id === requestReviewedId ? mutationError : null} />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="card">
        <div className="flex justify-content-between align-items-center mb-4 border-bottom-1 surface-border pb-3">
          <h4 className="m-0 text-900">Establecimientos activos</h4>
          <span className="text-600">{establishments.length} registros</span>
        </div>

        {establishmentsQuery.isLoading && <p className="text-600">Cargando establecimientos...</p>}

        {establishmentsQuery.isError && <Message severity="error" text={getApiErrorMessage(establishmentsQuery.error, 'No se pudo cargar el listado de establecimientos.')} className="w-full justify-content-start mb-4" />}

        <div className="flex flex-column gap-3">
          {establishments.map((item: any) => (
            <Card key={item.id} className="shadow-none border-1 surface-border">
              <div className="flex flex-column md:flex-row justify-content-between md:align-items-start gap-4">
                <div>
                  <div className="flex align-items-center gap-2 mb-2">
                    <h5 className="m-0 text-xl text-900">{item.name}</h5>
                    <Tag value={item.isActive ? 'Activo' : 'Inactivo'} severity={item.isActive ? 'success' : 'danger'} />
                    {isEstablishmentIncomplete(item) && <Tag value="⚠ Información pendiente" severity="warning" />}
                  </div>
                  <span className="text-sm text-500 block mb-2">
                    ID: {item.id} · User ID: {item.userId}
                  </span>
                  <p className="mt-0 mb-2 text-700">{item.description}</p>
                  <p className="m-0 text-600">
                    <i className="pi pi-map-marker mr-1" /> {item.address}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 md:justify-content-end align-items-start">
                  {isEstablishmentIncomplete(item) ? (
                    <Button label="Completar información" severity="warning" outlined onClick={() => router.push(`/establishments/${item.id}/edit`)} />
                  ) : (
                    <Button label="Gestionar" severity="info" outlined onClick={() => router.push(`/establishments/${item.id}`)} />
                  )}

                  {item.isActive ? (
                    <Button label="Desactivar" severity="danger" outlined onClick={() => deleteMutation.mutate(item.id)} loading={deleteMutation.isPending} />
                  ) : (
                    <Button label="Restaurar" severity="success" outlined onClick={() => restoreMutation.mutate(item.id)} loading={restoreMutation.isPending} />
                  )}
                </div>
              </div>
            </Card>
          ))}

          {!establishmentsQuery.isLoading && establishments.length === 0 && (
            <div className="text-center p-5 border-dashed border-1 surface-border border-round">
              <p className="text-600 mb-3">No hay establecimientos registrados todavía.</p>
              <Button label="Añadir establecimiento" icon="pi pi-plus" onClick={() => router.push('/establishments/new')} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
