'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Message } from 'primereact/message';
import { Skeleton } from 'primereact/skeleton';
import { getApiErrorMessage } from '@/lib/http/getApiErrorMessage';
import dynamic from 'next/dynamic';

const MapEmbed = dynamic(
  () => import('@/modules/establishments/components/MapEmbed'),
  {
    ssr: false,
    loading: () => <Skeleton height="300px" className="border-round" />
  }
);
import {
  getPublicEstablishmentById,
  listPublicRoomTypesByEstablishment,
  listPublicServicesByEstablishment,
  type PublicRoomTypeResponse
} from '@/modules/landing/api/publicCatalogApi';
import type { EstablishmentServiceResponse } from '@/modules/services/types';

import { getParishLabel } from '@/modules/establishments/constants/parishes';
import { Gallery } from '@/modules/shared/components/Gallery';
import {
  ROOM_AMENITY_GROUPS,
  type RoomAmenity
} from '@/modules/rooms/types';

const ROOM_CATEGORY_LABELS: Record<string, string> = {
  HOTEL_ROOM: 'Habitacion de hotel',
  HOSTEL_BED: 'Cama de hostel',
  APARTMENT: 'Apartamento',
  VILLA: 'Villa',
  GLAMPING_UNIT: 'Glamping'
};

export default function PublicEstablishmentPage({
  params
}: {
  params: { id: string };
}) {
  const numericId = Number(params.id);

  const establishmentQuery = useQuery({
    queryKey: ['public-establishment', numericId],
    queryFn: () => getPublicEstablishmentById(numericId),
    enabled: Number.isFinite(numericId)
  });

  const servicesQuery = useQuery({
    queryKey: ['public-establishment-services', numericId],
    queryFn: () => listPublicServicesByEstablishment(numericId),
    enabled: Number.isFinite(numericId)
  });

  const roomTypesQuery = useQuery({
    queryKey: ['public-establishment-room-types', numericId],
    queryFn: () => listPublicRoomTypesByEstablishment(numericId),
    enabled: Number.isFinite(numericId)
  });

  const activeRoomTypes: PublicRoomTypeResponse[] = (
    roomTypesQuery.data ?? []
  ).filter((rt: PublicRoomTypeResponse) => rt.hasVacancy);
  const services: EstablishmentServiceResponse[] = servicesQuery.data ?? [];

  return (
    <div className="min-h-screen w-full">
      <main
        className="mx-auto px-4 pb-6 pt-5 md:px-6 lg:px-8"
        style={{ maxWidth: '1280px' }}
      >
        {/* Header */}
        <section className="surface-card border-round-lg shadow-2 p-4 md:p-5">
          <small
            className="font-semibold uppercase text-500"
            style={{ letterSpacing: '0.2em', fontSize: '0.7rem' }}
          >
            Establecimiento
          </small>
          <h1 className="mt-2 text-2xl md:text-4xl text-900 m-0">
            {establishmentQuery.data?.name ?? 'Detalle del establecimiento'}
          </h1>
          <p className="mt-2 text-sm text-600 m-0">
            Explora libremente este establecimiento y sus opciones de
            habitacion.
          </p>
          <div className="mt-3">
            <Link href="/landing">
              <Button
                label="Volver al catalogo"
                icon="pi pi-arrow-left"
                className="p-button-outlined p-button-sm"
              />
            </Link>
          </div>
        </section>

        {establishmentQuery.isLoading && (
          <div className="mt-4 surface-card border-round-lg p-4 shadow-1">
            <Skeleton height="14rem" className="mb-3" />
            <Skeleton width="70%" className="mb-2" />
            <Skeleton width="50%" />
          </div>
        )}

        {establishmentQuery.isError && (
          <Message
            severity="error"
            text={getApiErrorMessage(
              establishmentQuery.error,
              'No se pudo cargar el establecimiento.'
            )}
            className="w-full mt-4"
          />
        )}

        {establishmentQuery.data && (
          <section className="mt-4 flex flex-column gap-4">
            <div className="grid">
              {/* Left Column (Images & Description) */}
              <div className="col-12 lg:col-7 flex flex-column gap-4">
                <article className="surface-card border-round-lg shadow-2 p-4 h-full">
                  <h2 className="text-xl text-900 m-0 mb-2">Acerca del establecimiento</h2>
                  <p className="text-sm text-600 m-0 mb-4 line-height-3">
                    {establishmentQuery.data.description}
                  </p>

                  {establishmentQuery.data.images ? (
                    <Gallery images={establishmentQuery.data.images} />
                  ) : (
                    <div
                      className="w-full flex align-items-center justify-content-center border-round-lg"
                      style={{
                        height: '14rem',
                        background:
                          'linear-gradient(135deg, rgba(80,188,178,0.15), white, rgba(243,215,144,0.2))'
                      }}
                    >
                      <span className="text-sm font-semibold text-600">
                        {establishmentQuery.data.name}
                      </span>
                    </div>
                  )}
                </article>
              </div>

              {/* Right Column (Location & Map) */}
              <div className="col-12 lg:col-5 flex flex-column gap-4">
                <article className="surface-card border-round-lg shadow-2 p-4 flex flex-column">
                  <h2 className="text-xl text-900 m-0 mb-3">Ubicación</h2>
                  
                  <div className="flex align-items-start gap-2 mb-2">
                    <i className="pi pi-map-marker text-primary mt-1"></i>
                    <div>
                      <span className="text-sm font-semibold text-900 block">Dirección</span>
                      <span className="text-sm text-600">{establishmentQuery.data.address}</span>
                    </div>
                  </div>

                  {establishmentQuery.data.parish && (
                    <div className="flex align-items-start gap-2 mb-3">
                      <i className="pi pi-compass text-primary mt-1"></i>
                      <div>
                        <span className="text-sm font-semibold text-900 block">Parroquia</span>
                        <span className="text-sm text-600">{getParishLabel(establishmentQuery.data.parish)}</span>
                      </div>
                    </div>
                  )}

                  {establishmentQuery.data.latitude != null &&
                    establishmentQuery.data.longitude != null ? (
                      <div className="mt-2 flex-grow-1" style={{ minHeight: '15rem' }}>
                        <MapEmbed
                          latitude={establishmentQuery.data.latitude}
                          longitude={establishmentQuery.data.longitude}
                          name={establishmentQuery.data.name}
                        />
                      </div>
                    ) : (
                      <div className="mt-2 flex-grow-1 flex align-items-center justify-content-center surface-100 border-round text-500 text-sm">
                        Mapa no disponible
                      </div>
                    )}
                </article>
              </div>
            </div>

            {/* Policies */}
            <article className="surface-card border-round-lg shadow-2 p-4">
              <h2 className="text-xl text-900 m-0 mb-3">Políticas del establecimiento</h2>
              <div className="grid grid-nogutter">
                {establishmentQuery.data.checkInTime && (
                  <div className="col-12 md:col-6 p-2">
                    <span className="text-500 text-sm font-medium block mb-1">Check-in</span>
                    <span className="text-900 text-sm">{establishmentQuery.data.checkInTime}</span>
                  </div>
                )}
                {establishmentQuery.data.checkOutTime && (
                  <div className="col-12 md:col-6 p-2">
                    <span className="text-500 text-sm font-medium block mb-1">Check-out</span>
                    <span className="text-900 text-sm">{establishmentQuery.data.checkOutTime}</span>
                  </div>
                )}
                {establishmentQuery.data.advancePaymentPolicy && (
                  <div className="col-12 p-2">
                    <span className="text-500 text-sm font-medium block mb-1">Política de pagos anticipados</span>
                    <span className="text-900 text-sm">{establishmentQuery.data.advancePaymentPolicy}</span>
                  </div>
                )}
                {establishmentQuery.data.cancellationPolicy && (
                  <div className="col-12 p-2">
                    <span className="text-500 text-sm font-medium block mb-1">Política de cancelación</span>
                    <span className="text-900 text-sm">{establishmentQuery.data.cancellationPolicy}</span>
                  </div>
                )}
                {establishmentQuery.data.childrenPolicy && (
                  <div className="col-12 md:col-6 p-2">
                    <span className="text-500 text-sm font-medium block mb-1">Niños</span>
                    <span className="text-900 text-sm">{establishmentQuery.data.childrenPolicy}</span>
                  </div>
                )}
                {establishmentQuery.data.ageRestrictionPolicy && (
                  <div className="col-12 md:col-6 p-2">
                    <span className="text-500 text-sm font-medium block mb-1">Restricción de edad</span>
                    <span className="text-900 text-sm">{establishmentQuery.data.ageRestrictionPolicy}</span>
                  </div>
                )}
                {establishmentQuery.data.petsPolicy && (
                  <div className="col-12 p-2">
                    <span className="text-500 text-sm font-medium block mb-1">Mascotas</span>
                    <span className="text-900 text-sm">{establishmentQuery.data.petsPolicy}</span>
                  </div>
                )}
                {(establishmentQuery.data.otherPolicies ?? []).length > 0 && (
                  <div className="col-12 p-2">
                    <span className="text-500 text-sm font-medium block mb-2">Otras políticas</span>
                    <ul className="m-0 pl-4 flex flex-column gap-1">
                      {(establishmentQuery.data.otherPolicies ?? []).map((policy: string, i: number) => (
                        <li key={i} className="text-900 text-sm">{policy}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </article>

            {/* Services */}
            <article className="surface-card border-round-lg shadow-2 p-4">
              <h2 className="text-xl text-900 m-0">Servicios que oferta</h2>

              {servicesQuery.isLoading && (
                <p className="mt-3 text-sm text-600 m-0">
                  Cargando servicios...
                </p>
              )}
              {servicesQuery.isError && (
                <Message
                  severity="error"
                  text={getApiErrorMessage(
                    servicesQuery.error,
                    'No se pudo cargar los servicios.'
                  )}
                  className="w-full mt-3"
                />
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                {services.map((service) => (
                  <Tag key={service.id} value={service.name} />
                ))}
              </div>

              {!servicesQuery.isLoading && services.length === 0 && (
                <p className="mt-3 text-sm text-600 m-0">
                  Este establecimiento aun no tiene servicios activos.
                </p>
              )}
            </article>

            {/* Room types */}
            <article className="surface-card border-round-lg shadow-2 p-4">
              <h2 className="text-xl text-900 m-0">Habitaciones disponibles</h2>
              <p className="mt-2 text-sm text-600 m-0">
                Selecciona una habitacion para ver detalle y continuar con la
                reserva.
              </p>

              {roomTypesQuery.isLoading && (
                <p className="mt-3 text-sm text-600 m-0">
                  Cargando tipos de habitacion...
                </p>
              )}
              {roomTypesQuery.isError && (
                <Message
                  severity="error"
                  text={getApiErrorMessage(
                    roomTypesQuery.error,
                    'No se pudo cargar los tipos de habitacion.'
                  )}
                  className="w-full mt-3"
                />
              )}

              <div className="mt-4 grid">
                {activeRoomTypes.map((roomType) => {
                  const thumbnail =
                    roomType.images.find((img) => img.isPrimary)?.url ?? null;

                  return (
                    <div key={roomType.id} className="col-12 md:col-6 xl:col-4">
                      <div className="surface-card border-1 border-300 border-round-lg p-4 h-full flex flex-column">
                        {thumbnail ? (
                          <div
                            className="w-full overflow-hidden border-round-lg bg-gray-100"
                            style={{ aspectRatio: '16/9' }}
                          >
                            <img
                              className="w-full h-full block"
                              src={thumbnail}
                              alt={roomType.name}
                              style={{ objectFit: 'cover' }}
                            />
                          </div>
                        ) : (
                          <div
                            className="w-full flex align-items-center justify-content-center border-round-lg"
                            style={{
                              aspectRatio: '16/9',
                              background:
                                'linear-gradient(135deg, rgba(243,215,144,0.18), white, rgba(80,188,178,0.18))'
                            }}
                          >
                            <span className="text-xs font-semibold text-600 text-center px-2">
                              {roomType.name}
                            </span>
                          </div>
                        )}

                        <div className="mt-3 flex align-items-start justify-content-between gap-2">
                          <p className="text-base font-semibold text-900 m-0">
                            {roomType.name}
                          </p>
                          <Tag
                            value={`${Number(roomType.pricePerNight).toFixed(
                              2
                            )} USD/noche`}
                            severity="info"
                          />
                        </div>

                        <p className="mt-1 text-xs text-600 m-0">
                          Categoria:{' '}
                          {ROOM_CATEGORY_LABELS[roomType.category] ??
                            roomType.category}
                        </p>
                        <p className="mt-1 text-xs text-600 m-0">
                          Capacidad: {roomType.capacity} persona(s)
                        </p>
                        <p
                          className="mt-2 text-sm text-700 m-0"
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {roomType.description}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-1">
                          {(roomType.amenities ?? []).slice(0, 4).map((amenity: RoomAmenity) => {
                            const label = ROOM_AMENITY_GROUPS.flatMap((g) => g.options).find((o) => o.value === amenity)?.label ?? amenity;
                            return <Tag key={`${roomType.id}-${amenity}`} value={label} className="text-xs" />;
                          })}
                        </div>

                        <div className="mt-auto pt-3">
                          <Link
                            href={`/landing/establishments/${numericId}/rooms/${roomType.id}`}
                          >
                            <Button
                              label="Ver detalle y reservar"
                              className="w-full"
                            />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {!roomTypesQuery.isLoading && activeRoomTypes.length === 0 && (
                <p className="mt-3 text-sm text-600 m-0">
                  Este establecimiento aun no tiene tipos de habitacion con
                  vacantes.
                </p>
              )}
            </article>
          </section>
        )}
      </main>
    </div>
  );
}
