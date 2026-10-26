'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { getApiErrorMessage } from '@/lib/http/getApiErrorMessage';
import { getEstablishmentById } from '@/modules/establishments/api/establishmentsApi';
import { getRoomTypeById } from '@/modules/rooms/api/roomTypesApi';
import {
  createRoomUnitInRoomType,
  deleteRoomUnit,
  listRoomUnitsByRoomType,
  restoreRoomUnit,
  updateRoomUnitStatus
} from '@/modules/rooms/api/roomUnitsApi';
import { ROOM_UNIT_STATUS_OPTIONS, type RoomUnitStatus } from '@/modules/rooms/types';

import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';

// ─── Fila de nueva habitación inline ───────────────────────────────────────
interface NewUnitRowProps {
  rowId: number;
  onCreated: () => void;
  onRemove: (id: number) => void;
  roomTypeId: number;
  toast: React.RefObject<Toast>;
}

function NewUnitRow({ rowId, onCreated, onRemove, roomTypeId, toast }: NewUnitRowProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const createMut = useMutation({
    mutationFn: () => createRoomUnitInRoomType(roomTypeId, { code: code.trim() }),
    onSuccess: () => {
      toast.current?.show({ severity: 'success', summary: 'Éxito', detail: `Habitación "${code.trim()}" creada.`, life: 3000 });
      onCreated();
    },
    onError: (err: any) => {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(err, 'No se pudo crear la habitación.'), life: 5000 });
    },
  });

  const handleCreate = () => {
    const trimmed = code.trim();
    if (trimmed.length === 0) { setError('El código es obligatorio.'); return; }
    if (trimmed.length > 20) { setError('Máximo 20 caracteres.'); return; }
    setError('');
    createMut.mutate();
  };

  return (
    <div className="border-1 border-primary-200 border-round p-3 surface-50 flex flex-column gap-2 animate-fadein">
      <div className="flex align-items-start gap-2">
        <div className="flex flex-column gap-1 flex-1">
          <InputText
            value={code}
            onChange={(e) => { setCode(e.target.value); if (error) setError(''); }}
            placeholder="Código (ej. A-101)"
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreate(); } }}
            className={classNames('w-full', { 'p-invalid': !!error })}
            autoFocus
          />
          {error && <small className="p-error">{error}</small>}
        </div>
        <Button
          label="Crear habitación"
          icon="pi pi-check"
          size="small"
          loading={createMut.isPending}
          onClick={handleCreate}
          style={{ minWidth: '10rem' }}
          className="flex-shrink-0"
        />
        <Button
          icon="pi pi-times"
          size="small"
          severity="secondary"
          text
          onClick={() => onRemove(rowId)}
          className="flex-shrink-0"
          tooltip="Cancelar"
          tooltipOptions={{ position: 'top' }}
        />
      </div>
    </div>
  );
}

// ─── Página principal ────────────────────────────────────────────────────────
export default function RoomUnitsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useParams();
  const establishmentId = Number(params.id);
  const roomTypeId = Number(params.roomTypeId);
  const toast = useRef<Toast>(null);
  const [statusDrafts, setStatusDrafts] = useState<Record<number, RoomUnitStatus>>({});
  const [mounted, setMounted] = useState(false);
  // Lista de IDs de filas de nueva habitación (permite múltiples a la vez)
  const [newRows, setNewRows] = useState<number[]>([]);
  const nextRowId = useRef(0);

  useEffect(() => { setMounted(true); }, []);

  const canAccess = user?.role === 'ESTABLISHMENT_ADMIN';

  const estQuery = useQuery({ queryKey: ['establishment', establishmentId], queryFn: () => getEstablishmentById(establishmentId), enabled: Number.isFinite(establishmentId) && canAccess && mounted });
  const rtQuery = useQuery({ queryKey: ['room-type', roomTypeId], queryFn: () => getRoomTypeById(roomTypeId), enabled: Number.isFinite(roomTypeId) && canAccess && mounted });

  const isOwnerViolation = user?.role === 'ESTABLISHMENT_ADMIN' && estQuery.data && estQuery.data.userId !== user?.id;
  const isRoomTypeMismatch = rtQuery.data && rtQuery.data.establishmentId !== establishmentId;

  const canFetch = Number.isFinite(roomTypeId) && canAccess && !isOwnerViolation && !isRoomTypeMismatch && mounted;

  const unitsQuery = useQuery({ queryKey: ['room-units', roomTypeId], queryFn: () => listRoomUnitsByRoomType(roomTypeId, 'ALL'), enabled: canFetch });
  const units = unitsQuery.data ?? [];

  const deleteMut = useMutation({
    mutationFn: (unitId: number) => deleteRoomUnit(unitId),
    onSuccess: () => { toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Habitación desactivada.', life: 3000 }); queryClient.invalidateQueries({ queryKey: ['room-units', roomTypeId] }); },
    onError: (err: any) => { toast.current?.show({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(err, 'No se pudo desactivar.'), life: 5000 }); },
  });

  const restoreMut = useMutation({
    mutationFn: (unitId: number) => restoreRoomUnit(unitId),
    onSuccess: () => { toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Habitación restaurada.', life: 3000 }); queryClient.invalidateQueries({ queryKey: ['room-units', roomTypeId] }); },
    onError: (err: any) => { toast.current?.show({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(err, 'No se pudo restaurar.'), life: 5000 }); },
  });

  const updateStatusMut = useMutation({
    mutationFn: ({ unitId, status }: { unitId: number; status: RoomUnitStatus }) => updateRoomUnitStatus(unitId, { status }),
    onSuccess: () => { toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Estado actualizado.', life: 3000 }); queryClient.invalidateQueries({ queryKey: ['room-units', roomTypeId] }); },
    onError: (err: any) => { toast.current?.show({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(err, 'No se pudo actualizar el estado.'), life: 5000 }); },
  });

  const addNewRow = () => {
    const id = nextRowId.current++;
    setNewRows((prev) => [...prev, id]);
  };

  const removeRow = (id: number) => {
    setNewRows((prev) => prev.filter((r) => r !== id));
  };

  const handleCreated = (id: number) => {
    // Refresca la lista y elimina la fila creada
    queryClient.invalidateQueries({ queryKey: ['room-units', roomTypeId] });
    setNewRows((prev) => prev.filter((r) => r !== id));
  };

  if (!mounted) return null;
  if (!canAccess) return <div className="card"><Message severity="error" text="No tienes permisos para visualizar habitaciones." className="w-full justify-content-start" /></div>;

  return (
    <div className="flex flex-column gap-3">
      <Toast ref={toast} />

      <div className="card flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center gap-3">
        <div>
          <h2 className="m-0 text-900">{rtQuery.data?.name ?? 'Cargando tipo...'}</h2>
          <p className="mt-2 mb-0 text-600">Gestiona las habitaciones individuales de este tipo.</p>
        </div>
        <div className="flex gap-2">
          <Button label="Añadir habitación" icon="pi pi-plus" onClick={addNewRow} />
          <Button label="Volver a tipos" icon="pi pi-arrow-left" outlined severity="secondary" onClick={() => router.push(`/establishments/${establishmentId}/rooms`)} />
        </div>
      </div>

      {isOwnerViolation && <Message severity="error" text="No puedes administrar habitaciones de un establecimiento que no te pertenece." className="w-full justify-content-start" />}
      {isRoomTypeMismatch && <Message severity="error" text="El tipo de habitación no pertenece al establecimiento seleccionado." className="w-full justify-content-start" />}

      {!isOwnerViolation && !isRoomTypeMismatch && (
        <div className="card">
          <div className="flex justify-content-between align-items-center border-bottom-1 surface-border pb-3 mb-4">
            <h3 className="m-0 text-900 text-xl">Listado de habitaciones</h3>
            <span className="text-600 text-sm">{units.length} registros</span>
          </div>

          {unitsQuery.isLoading && <p className="text-600">Cargando habitaciones...</p>}
          {unitsQuery.isError && <Message severity="error" text={getApiErrorMessage(unitsQuery.error, 'No se pudo cargar las habitaciones.')} className="w-full justify-content-start mb-3" />}

          <div className="flex flex-column gap-3">
            {/* ── Filas de nueva habitación (inline) ── */}
            {newRows.map((rowId) => (
              <NewUnitRow
                key={rowId}
                rowId={rowId}
                roomTypeId={roomTypeId}
                toast={toast}
                onCreated={() => handleCreated(rowId)}
                onRemove={removeRow}
              />
            ))}

            {/* ── Habitaciones existentes ── */}
            {units.map((item: any) => {
              const currentStatus = statusDrafts[item.id] ?? item.status;
              return (
                <div key={item.id} className="border-1 surface-border border-round p-4">
                  <div className="flex flex-column md:flex-row justify-content-between align-items-start gap-3">
                    <div className="flex-1">
                      <div className="flex align-items-center gap-2 mb-2">
                        <span className="font-semibold text-900 text-lg">Habitación {item.code}</span>
                        <Tag severity={item.isActive ? 'success' : 'danger'} value={item.isActive ? 'Activa' : 'Inactiva'} />
                      </div>
                      <div className="flex align-items-center gap-2 mt-3">
                        <Dropdown
                          value={currentStatus}
                          options={ROOM_UNIT_STATUS_OPTIONS as any}
                          optionLabel="label"
                          optionValue="value"
                          onChange={(e) => setStatusDrafts((prev) => ({ ...prev, [item.id]: e.value }))}
                          className="w-12rem"
                        />
                        <Button
                          label="Actualizar estado"
                          icon="pi pi-sync"
                          outlined
                          size="small"
                          severity="warning"
                          disabled={updateStatusMut.isPending || currentStatus === item.status}
                          onClick={() => updateStatusMut.mutate({ unitId: item.id, status: currentStatus })}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button label="Editar" icon="pi pi-pencil" outlined size="small" onClick={() => router.push(`/establishments/${establishmentId}/rooms/${roomTypeId}/units/${item.id}/edit`)} />
                      {item.isActive ? (
                        <Button label="Desactivar" icon="pi pi-ban" outlined severity="danger" size="small" onClick={() => deleteMut.mutate(item.id)} loading={deleteMut.isPending} />
                      ) : (
                        <Button label="Restaurar" icon="pi pi-refresh" outlined severity="success" size="small" onClick={() => restoreMut.mutate(item.id)} loading={restoreMut.isPending} />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {!unitsQuery.isLoading && units.length === 0 && newRows.length === 0 && (
              <div className="surface-100 p-4 border-round border-1 surface-border text-center">
                <p className="text-600 mb-3">No hay habitaciones registradas todavía para este tipo.</p>
                <Button label="Añadir habitación" icon="pi pi-plus" outlined onClick={addNewRow} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
