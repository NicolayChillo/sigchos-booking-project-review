'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';

import { useAuth } from '@/lib/auth/AuthContext';
import { getApiErrorMessage } from '@/lib/http/getApiErrorMessage';
import { getEstablishmentById } from '@/modules/establishments/api/establishmentsApi';
import { listServicesByEstablishment } from '@/modules/services/api/servicesApi';
import { SERVICE_CATEGORIES } from '@/modules/services/types';
import { listRoomTypesByEstablishment } from '@/modules/rooms/api/roomTypesApi';
import { listRoomUnitsByRoomType } from '@/modules/rooms/api/roomUnitsApi';
import {
  ROOM_AMENITY_GROUPS,
  ROOM_BED_TYPE_OPTIONS,
  ROOM_CATEGORY_OPTIONS,
  type RoomAmenity,
  type RoomCategory,
  type RoomTypeResponse
} from '@/modules/rooms/types';
import {
  isEstablishmentIncomplete,
  getMissingFields
} from '@/modules/establishments/utils/establishmentUtils';
import { EstablishmentIncompleteAlert } from '@/modules/establishments/components/EstablishmentIncompleteAlert';
import { getParishLabel } from '@/modules/establishments/constants/parishes';

import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';
import { TabView, TabPanel } from 'primereact/tabview';
import { Gallery } from '@/modules/shared/components/Gallery';

const MapEmbed = dynamic(
  () => import('@/modules/establishments/components/MapEmbed'),
  { ssr: false }
);

// ── Helpers ─────────────────────────────────────────────────────────────────
function formatMoney(value: number): string {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function getServiceCategoryLabel(category: string): string {
  return SERVICE_CATEGORIES.find((item) => item.value === category)?.label ?? category;
}

function getRoomCategoryLabel(category: RoomCategory): string {
  return ROOM_CATEGORY_OPTIONS.find((item) => item.value === category)?.label ?? category;
}

function getBedTypeLabel(bedType: RoomTypeResponse['bedType']): string {
  return ROOM_BED_TYPE_OPTIONS.find((item) => item.value === bedType)?.label ?? bedType;
}

function getAmenityLabel(amenity: RoomAmenity): string {
  for (const group of ROOM_AMENITY_GROUPS) {
    const match = group.options.find((option) => option.value === amenity);
    if (match) return match.label;
  }
  return amenity;
}

// ── Reusable empty state ─────────────────────────────────────────────────────
function EmptyState({ text }: { text: string }) {
  return (
    <div className="surface-100 p-4 border-round border-1 surface-border text-center">
      <span className="text-600">{text}</span>
    </div>
  );
}

// ── Info row for detail grids ────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="col-12 md:col-6 p-3">
      <div className="text-500 font-medium mb-1 text-sm">{label}</div>
      <div className="text-900">{value ?? '-'}</div>
    </div>
  );
}

function InfoRowFull({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="col-12 p-3">
      <div className="text-500 font-medium mb-1 text-sm">{label}</div>
      <div className="text-900">{value ?? '-'}</div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function EstablishmentDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const numericId = Number(params.id);
  const canAccessEstablishments = user?.role === 'ESTABLISHMENT_ADMIN';
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const detailQuery = useQuery({
    queryKey: ['establishment', numericId],
    queryFn: () => getEstablishmentById(numericId),
    enabled: Number.isFinite(numericId) && canAccessEstablishments && mounted,
  });

  const isOwnerViolation =
    user?.role === 'ESTABLISHMENT_ADMIN' &&
    detailQuery.data &&
    detailQuery.data.userId !== user.id;

  const canLoadRelatedData =
    Number.isFinite(numericId) &&
    canAccessEstablishments &&
    Boolean(detailQuery.data) &&
    !isOwnerViolation &&
    mounted;

  const servicesQuery = useQuery({
    queryKey: ['establishment-services', numericId],
    queryFn: () => listServicesByEstablishment(numericId),
    enabled: canLoadRelatedData,
  });

  const roomTypesQuery = useQuery({
    queryKey: ['establishment-room-types', numericId],
    queryFn: () => listRoomTypesByEstablishment(numericId, 'ALL'),
    enabled: canLoadRelatedData,
  });

  const ownerName = useMemo(() => {
    if (!detailQuery.data) return '-';
    if (detailQuery.data.userId === user?.id) {
      return `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || '-';
    }
    return 'Propietario no disponible';
  }, [detailQuery.data, user?.firstName, user?.id, user?.lastName]);

  const services = servicesQuery.data ?? [];
  const roomTypes = roomTypesQuery.data ?? [];

  // Active room types
  const activeRoomTypes = roomTypes.filter((rt: any) => rt.isActive);

  // Query room units for every active room type (in parallel).
  // We only need to know if at least ONE has an active unit.
  const roomUnitsQueries = useQueries({
    queries: activeRoomTypes.map((rt: any) => ({
      queryKey: ['room-units', rt.id],
      queryFn: () => listRoomUnitsByRoomType(rt.id, 'ACTIVE'),
      enabled: canLoadRelatedData && !roomTypesQuery.isLoading,
    }))
  });

  // True only when all unit queries have resolved
  const allUnitsLoaded = roomUnitsQueries.every((q) => !q.isLoading);
  const hasActiveRoomWithUnit =
    allUnitsLoaded &&
    roomUnitsQueries.some((q) => Array.isArray(q.data) && q.data.length > 0);

  // Show the warning when data is available and inventory is insufficient
  const showInventoryWarning =
    !roomTypesQuery.isLoading &&
    allUnitsLoaded &&
    !hasActiveRoomWithUnit;

  if (!mounted) return null;

  if (!canAccessEstablishments) {
    return (
      <div className="card text-center p-5">
        <i className="pi pi-lock text-5xl text-red-500 mb-4" />
        <h2 className="text-900 m-0 mb-2">Acceso denegado</h2>
        <p className="text-600 m-0">No tienes permisos para visualizar el detalle de establecimientos.</p>
      </div>
    );
  }

  const establishment = detailQuery.data;

  return (
    <div className="flex flex-column gap-3">

      {/* ── Header ── */}
      <div className="card flex flex-column md:flex-row justify-content-between align-items-start gap-3">
        <div>
          <h2 className="m-0 text-900">
            {establishment?.name ?? (detailQuery.isLoading ? 'Cargando...' : 'Establecimiento')}
          </h2>
          <p className="mt-2 mb-0 text-600">
            Vista detallada del establecimiento con información general, servicios y habitaciones.
          </p>
        </div>
        <Button
          label="Volver al listado"
          icon="pi pi-arrow-left"
          outlined
          severity="secondary"
          onClick={() => router.push('/establishments')}
          className="flex-shrink-0"
        />
      </div>

      {/* ── Loading / error states ── */}
      {detailQuery.isLoading && (
        <div className="card flex align-items-center gap-2 text-600">
          <i className="pi pi-spin pi-spinner" />
          <span>Cargando detalle...</span>
        </div>
      )}

      {detailQuery.isError && (
        <Message
          severity="error"
          text={getApiErrorMessage(detailQuery.error, 'No se pudo obtener el detalle.')}
          className="w-full justify-content-start"
        />
      )}

      {isOwnerViolation && (
        <Message
          severity="error"
          text="No puedes visualizar este establecimiento porque no pertenece a tu cuenta."
          className="w-full justify-content-start"
        />
      )}

      {establishment && !isOwnerViolation && (
        <>
          <EstablishmentIncompleteAlert
            missingFields={getMissingFields(establishment)}
            establishmentId={numericId}
            roomsPath={showInventoryWarning ? `/establishments/${numericId}/rooms` : undefined}
          />

          {/* ── Quick-action cards ── */}
          <div className="grid">
            {/* Status chip */}
            <div className="col-12 md:col-4">
              <div className="card h-full flex flex-column gap-2 p-3">
                <span className="text-500 text-sm font-medium">Estado</span>
                <div className="flex align-items-center gap-2">
                  <Tag
                    severity={establishment.isActive ? 'success' : 'danger'}
                    value={establishment.isActive ? 'Activo' : 'Inactivo'}
                  />
                </div>
              </div>
            </div>

            <div className="col-12 md:col-4">
              <div className="card h-full flex flex-column gap-2 p-3">
                <span className="text-500 text-sm font-medium">Servicios registrados</span>
                <div className="flex align-items-center justify-content-between gap-2">
                  <span className="text-2xl font-bold text-900">
                    {servicesQuery.isLoading ? '—' : services.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="col-12 md:col-4">
              <div className="card h-full flex flex-column gap-2 p-3">
                <span className="text-500 text-sm font-medium">Tipos de habitación</span>
                <div className="flex align-items-center justify-content-between gap-2">
                  <span className="text-2xl font-bold text-900">
                    {roomTypesQuery.isLoading ? '—' : roomTypes.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Main tabs ── */}
          <div className="card">
            <TabView>
              {/* ── Tab 1: Información general ── */}
              <TabPanel
                header="Información general"
                leftIcon="pi pi-building mr-2"
              >
                <div className="flex justify-content-end mb-3">
                  <Button
                    label="Editar detalles"
                    icon="pi pi-pencil"
                    onClick={() => router.push(`/establishments/${numericId}/edit`)}
                  />
                </div>

                <div className="grid grid-nogutter border-top-1 surface-border">
                  <InfoRow label="Nombre" value={establishment.name} />
                  <InfoRow label="Propietario" value={ownerName} />
                  <InfoRowFull label="Descripción" value={establishment.description} />
                  <InfoRow label="Dirección" value={establishment.address} />
                  <InfoRow label="Parroquia" value={getParishLabel(establishment.parish)} />
                </div>

                {/* Gallery + Map side by side */}
                <div className="mt-4 pt-3 border-top-1 surface-border">
                  <div className="grid">
                    {/* Gallery column */}
                    <div className={establishment.latitude != null && establishment.longitude != null ? 'col-12 lg:col-6' : 'col-12'}>
                      <h4 className="m-0 mb-3 text-900 font-medium">Imágenes</h4>
                      <Gallery images={establishment.images} altText="Imagen del local" />
                    </div>

                    {/* Map column */}
                    {establishment.latitude != null && establishment.longitude != null && (
                      <div className="col-12 lg:col-6">
                        <h4 className="m-0 mb-3 text-900 font-medium">Ubicación</h4>
                        <MapEmbed
                          latitude={establishment.latitude}
                          longitude={establishment.longitude}
                          name={establishment.name}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </TabPanel>

              {/* ── Tab 2: Políticas ── */}
              <TabPanel
                header="Políticas"
                leftIcon="pi pi-file-edit mr-2"
              >

                <div className="grid grid-nogutter surface-border">
                  <InfoRow label="Check-in" value={establishment.checkInTime} />
                  <InfoRow label="Check-out" value={establishment.checkOutTime} />
                  <InfoRowFull label="Pagos anticipados" value={establishment.advancePaymentPolicy} />
                  <InfoRowFull label="Cancelación" value={establishment.cancellationPolicy} />
                  <InfoRow
                    label="Penalización después de la hora"
                    value={
                      establishment.cancelPenaltyAfterEnabled
                        ? `${establishment.cancelPenaltyAfterPercentage ?? 0}%`
                        : 'No aplica'
                    }
                  />
                  <InfoRow
                    label="Ventana de horas para cancelación"
                    value={
                      establishment.cancelPenaltyWindowHours
                        ? `${establishment.cancelPenaltyWindowHours}h`
                        : 'No aplica'
                    }
                  />
                  <InfoRowFull label="Estancias de niños" value={establishment.childrenPolicy} />
                  <InfoRow label="Restricción por edad" value={establishment.ageRestrictionPolicy} />
                  <InfoRow label="Mascotas" value={establishment.petsPolicy} />
                  {(establishment.otherPolicies ?? []).length > 0 && (
                    <div className="col-12 p-3">
                      <div className="text-500 font-medium mb-2 text-sm">Otras políticas</div>
                      <ul className="m-0 pl-4 flex flex-column gap-1">
                        {(establishment.otherPolicies ?? []).map((policy: string, i: number) => (
                          <li key={i} className="text-900">{policy}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </TabPanel>

              {/* ── Tab 3: Servicios ── */}
              <TabPanel
                header={`Servicios (${services.length})`}
                leftIcon="pi pi-th-large mr-2"
              >
                <div className="flex justify-content-end mb-3">
                  <Button
                    label="Gestionar servicios"
                    icon="pi pi-pencil"
                    onClick={() => router.push(`/establishments/${numericId}/services`)}
                  />
                </div>

                {servicesQuery.isLoading && (
                  <div className="flex align-items-center gap-2 text-600 py-3">
                    <i className="pi pi-spin pi-spinner" />
                    <span>Cargando servicios...</span>
                  </div>
                )}

                {servicesQuery.isError && (
                  <Message
                    severity="error"
                    text={getApiErrorMessage(servicesQuery.error, 'No se pudieron cargar los servicios.')}
                    className="w-full justify-content-start"
                  />
                )}

                {!servicesQuery.isLoading && !servicesQuery.isError && services.length === 0 && (
                  <EmptyState text="Este establecimiento aún no tiene servicios registrados." />
                )}

                {!servicesQuery.isLoading && !servicesQuery.isError && services.length > 0 && (
                  <div className="flex flex-column gap-3">
                    {services.map((service: any) => (
                      <div
                        key={service.id}
                        className="border-1 surface-border border-round p-3 flex flex-column md:flex-row justify-content-between gap-3"
                      >
                        <div className="flex-1">
                          <div className="font-semibold text-900 mb-1">{service.name}</div>
                          <div className="text-500 text-sm mb-2">
                            {getServiceCategoryLabel(service.category)}
                          </div>
                          <div className="text-700 text-sm">{service.description}</div>
                        </div>
                        <div className="flex flex-column gap-2 text-sm align-items-end md:align-items-start flex-shrink-0">
                          <div className="text-700">
                            {service.hasAdditionalCost
                              ? formatMoney(Number(service.additionalCost))
                              : 'Sin costo extra'}
                          </div>
                          <Tag
                            severity={service.isActive ? 'success' : 'danger'}
                            value={service.isActive ? 'Activo' : 'Inactivo'}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabPanel>

              {/* ── Tab 4: Habitaciones ── */}
              <TabPanel
                header={`Habitaciones (${roomTypes.length})`}
                leftIcon="pi pi-home mr-2"
              >
                <div className="flex justify-content-end mb-3">
                  <Button
                    label="Gestionar habitaciones"
                    icon="pi pi-pencil"
                    onClick={() => router.push(`/establishments/${numericId}/rooms`)}
                  />
                </div>

                {roomTypesQuery.isLoading && (
                  <div className="flex align-items-center gap-2 text-600 py-3">
                    <i className="pi pi-spin pi-spinner" />
                    <span>Cargando tipos de habitación...</span>
                  </div>
                )}

                {roomTypesQuery.isError && (
                  <Message
                    severity="error"
                    text={getApiErrorMessage(roomTypesQuery.error, 'No se pudieron cargar los tipos de habitación.')}
                    className="w-full justify-content-start"
                  />
                )}

                {!roomTypesQuery.isLoading && !roomTypesQuery.isError && roomTypes.length === 0 && (
                  <EmptyState text="Este establecimiento aún no tiene tipos de habitación configurados." />
                )}

                {!roomTypesQuery.isLoading && !roomTypesQuery.isError && roomTypes.length > 0 && (
                  <div className="flex flex-column gap-3">
                    {roomTypes.map((roomType: any) => (
                      <div
                        key={roomType.id}
                        className="border-1 surface-border border-round p-3 flex flex-column md:flex-row gap-4"
                      >
                        {/* Left: main info */}
                        <div className="flex-1">
                          <div className="font-semibold text-900 mb-1">{roomType.name}</div>
                          <div className="text-500 text-sm mb-2">
                            {getRoomCategoryLabel(roomType.category)}
                          </div>
                          <div className="text-700 text-sm">{roomType.description}</div>
                        </div>

                        {/* Right: details grid */}
                        <div className="flex flex-column gap-1 text-sm text-700 flex-shrink-0" style={{ minWidth: '180px' }}>
                          <div>
                            <span className="font-medium">Capacidad: </span>
                            {roomType.capacity} persona(s)
                          </div>
                          <div>
                            <span className="font-medium">Camas: </span>
                            {roomType.bedCount} ({getBedTypeLabel(roomType.bedType)})
                          </div>
                          <div>
                            <span className="font-medium">Precio/noche: </span>
                            {formatMoney(Number(roomType.pricePerNight))}
                          </div>
                          <div className="flex align-items-center gap-2">
                            <span className="font-medium">Estado: </span>
                            <Tag
                              severity={roomType.isActive ? 'success' : 'danger'}
                              value={roomType.isActive ? 'Activo' : 'Inactivo'}
                            />
                          </div>
                          {roomType.amenities.length > 0 && (
                            <div>
                              <span className="font-medium">Amenidades: </span>
                              {roomType.amenities.map((a: any) => getAmenityLabel(a)).join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabPanel>
            </TabView>
          </div>
        </>
      )}
    </div>
  );
}
