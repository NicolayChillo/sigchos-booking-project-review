'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Message } from 'primereact/message';
import { useAuth } from '@/lib/auth/AuthContext';
import { getApiErrorMessage } from '@/lib/http/getApiErrorMessage';
import { createBooking } from '@/modules/bookings/api/bookingsApi';
import {
  getPublicEstablishmentById,
  listPublicAvailableRoomUnitsByRoomType,
  listPublicRoomTypesByEstablishment,
  type PublicRoomTypeResponse
} from '@/modules/landing/api/publicCatalogApi';
import { Gallery } from '@/modules/shared/components/Gallery';
import {
  ROOM_AMENITY_GROUPS,
  type RoomAmenity
} from '@/modules/rooms/types';

export default function PublicRoomTypeBookingPage({
  params
}: {
  params: { id: string; roomTypeId: string };
}) {
  const numericId = Number(params.id);
  const numericRoomTypeId = Number(params.roomTypeId);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Today's date in yyyy-mm-dd (local)
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const initialCheckInDate = searchParams.get('checkInDate') ?? '';
  const initialCheckOutDate = searchParams.get('checkOutDate') ?? '';

  const { isAuthenticated, user } = useAuth();
  const [checkInDate, setCheckInDate] = useState(initialCheckInDate);
  const [checkOutDate, setCheckOutDate] = useState(initialCheckOutDate);
  const [bookingMessage, setBookingMessage] = useState<string | null>(null);
  const [isBookingSuccess, setIsBookingSuccess] = useState(false);

  // Build login URL preserving the current room path and any dates already entered
  const loginHref = useMemo(() => {
    const returnPath = `/landing/establishments/${numericId}/rooms/${numericRoomTypeId}`;
    const params = new URLSearchParams();
    params.set('redirectTo', returnPath);
    if (checkInDate) params.set('checkInDate', checkInDate);
    if (checkOutDate) params.set('checkOutDate', checkOutDate);
    return `/auth/login?${params.toString()}`;
  }, [numericId, numericRoomTypeId, checkInDate, checkOutDate]);

  const establishmentQuery = useQuery({
    queryKey: ['public-establishment', numericId],
    queryFn: () => getPublicEstablishmentById(numericId),
    enabled: Number.isFinite(numericId)
  });

  const roomTypesQuery = useQuery({
    queryKey: ['public-establishment-room-types', numericId],
    queryFn: () => listPublicRoomTypesByEstablishment(numericId),
    enabled: Number.isFinite(numericId)
  });

  const selectedRoomType = useMemo(() => {
    if (!Number.isFinite(numericRoomTypeId)) return null;
    return (
      (roomTypesQuery.data ?? []).find(
        (item: PublicRoomTypeResponse) => item.id === numericRoomTypeId
      ) ?? null
    );
  }, [numericRoomTypeId, roomTypesQuery.data]);

  const roomPricingSummary = useMemo(() => {
    if (!selectedRoomType) {
      return {
        requiresAdvancePayment: false,
        advancePaymentPercentage: 0,
        totalPerNight: 0,
        advanceAmountPerNight: 0
      };
    }
    const totalPerNight = Number(selectedRoomType.pricePerNight);
    const requiresAdvancePayment = selectedRoomType.requiresAdvancePayment;
    const advancePaymentPercentage = requiresAdvancePayment
      ? selectedRoomType.advancePaymentPercentage
      : 0;
    const advanceAmountPerNight =
      totalPerNight * (advancePaymentPercentage / 100);
    return {
      requiresAdvancePayment,
      advancePaymentPercentage,
      totalPerNight,
      advanceAmountPerNight
    };
  }, [selectedRoomType]);

  const roomUnitsQuery = useQuery({
    queryKey: [
      'public-establishment-room-units',
      numericId,
      numericRoomTypeId,
      checkInDate,
      checkOutDate
    ],
    queryFn: () =>
      listPublicAvailableRoomUnitsByRoomType(
        numericId,
        numericRoomTypeId,
        checkInDate || undefined,
        checkOutDate || undefined
      ),
    enabled:
      Number.isFinite(numericId) &&
      Number.isFinite(numericRoomTypeId) &&
      Boolean(checkInDate && checkOutDate)
  });

  const autoAssignedRoomUnit = roomUnitsQuery.data?.[0] ?? null;
  const hasAvailability = (roomUnitsQuery.data?.length ?? 0) > 0;

  const createBookingMutation = useMutation({
    mutationFn: createBooking,
    onSuccess: (booking) => {
      if (isAuthenticated && user && booking.userId === user.id) {
        router.push(`/bookings/${booking.id}/payments`);
      } else {
        setBookingMessage(
          'Reserva creada correctamente. Revisa el panel de reservas para seguimiento.'
        );
        setIsBookingSuccess(true);
      }
    },
    onError: (error) => {
      setBookingMessage(
        getApiErrorMessage(error, 'No se pudo crear la reserva.')
      );
      setIsBookingSuccess(false);
    }
  });

  function handleCreateBooking() {
    if (!isAuthenticated) {
      setBookingMessage(
        'Necesitas iniciar sesion para agendar esta habitacion.'
      );
      setIsBookingSuccess(false);
      return;
    }
    if (user?.role !== 'CLIENT') {
      setBookingMessage('Solo los clientes pueden crear reservas.');
      setIsBookingSuccess(false);
      return;
    }
    if (!user?.profileCompleted) {
      setBookingMessage('Necesitas completar tu perfil para poder agendar.');
      setIsBookingSuccess(false);
      return;
    }
    if (!checkInDate || !checkOutDate) {
      setBookingMessage('Selecciona fechas de check-in y check-out.');
      setIsBookingSuccess(false);
      return;
    }
    if (checkInDate < todayStr) {
      setBookingMessage('La fecha de check-in no puede ser anterior al día de hoy.');
      setIsBookingSuccess(false);
      return;
    }
    if (checkOutDate <= checkInDate) {
      setBookingMessage('La fecha de check-out debe ser posterior al check-in.');
      setIsBookingSuccess(false);
      return;
    }
    if (!hasAvailability || !autoAssignedRoomUnit) {
      setBookingMessage(
        'En las fechas seleccionadas no se encuentra disponible este tipo de habitacion.'
      );
      setIsBookingSuccess(false);
      return;
    }
    setBookingMessage(null);
    createBookingMutation.mutate({
      roomUnitId: autoAssignedRoomUnit.id,
      checkInDate,
      checkOutDate
    });
  }

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
            Habitacion seleccionada
          </small>
          <h1 className="mt-2 text-2xl md:text-4xl text-900 m-0">
            {selectedRoomType?.name ?? 'Detalle de habitacion'}
          </h1>
          <p className="mt-2 text-sm text-600 m-0">
            Revisa los detalles y valida disponibilidad antes de agendar.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={`/landing/establishments/${numericId}/rooms`}>
              <Button
                label="Volver a habitaciones"
                icon="pi pi-arrow-left"
                className="p-button-outlined p-button-sm"
              />
            </Link>
            <Link href="/landing">
              <Button
                label="Volver al catalogo"
                icon="pi pi-arrow-left"
                className="p-button-outlined p-button-sm"
              />
            </Link>
          </div>
        </section>

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
        {roomTypesQuery.isError && (
          <Message
            severity="error"
            text={getApiErrorMessage(
              roomTypesQuery.error,
              'No se pudo cargar el tipo de habitacion.'
            )}
            className="w-full mt-4"
          />
        )}
        {!selectedRoomType && !roomTypesQuery.isLoading && (
          <Message
            severity="warn"
            text="El tipo de habitacion solicitado no existe o no esta disponible."
            className="w-full mt-4"
          />
        )}

        {selectedRoomType && (
          <section className="mt-4 grid" id="reserva">
            {/* Image */}
            <div className="col-12 lg:col-7">
              <div className="surface-card border-round-lg shadow-2 p-4">
                {selectedRoomType.images ? (
                  <Gallery images={selectedRoomType.images} />
                ) : (
                  <div
                    className="w-full flex align-items-center justify-content-center border-round-lg"
                    style={{
                      minHeight: '16rem',
                      background:
                        'linear-gradient(135deg, rgba(80,188,178,0.15), white, rgba(243,215,144,0.2))'
                    }}
                  >
                    <span className="text-sm font-semibold text-600">
                      {selectedRoomType.name}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Booking form */}
            <div className="col-12 lg:col-5">
              <div className="surface-card border-round-lg shadow-2 p-4">
                <h2 className="text-xl text-900 m-0">
                  Reserva esta habitacion
                </h2>
                <p className="mt-2 text-sm text-600 m-0">
                  Selecciona tus fechas para validar disponibilidad. Esta
                  habitacion
                  {roomPricingSummary.requiresAdvancePayment
                    ? ` requiere ${roomPricingSummary.advancePaymentPercentage}% de anticipo.`
                    : ' no requiere anticipo.'}
                </p>

                <Message
                  severity="warn"
                  text={`Politica de cancelacion: ${
                    establishmentQuery.data?.cancellationPolicy ??
                    'No se ha configurado una politica de cancelacion para este establecimiento.'
                  }`}
                  className="w-full mt-3"
                />

                <div className="mt-4 flex flex-column gap-3">
                  <div className="grid formgrid">
                    <div className="field col-6">
                      <label
                        htmlFor="checkIn"
                        className="text-sm font-semibold text-900"
                      >
                        Check-in
                      </label>
                      <InputText
                        id="checkIn"
                        type="date"
                        className="w-full"
                        value={checkInDate}
                        min={todayStr}
                        onChange={(e) => setCheckInDate(e.target.value)}
                      />
                    </div>
                    <div className="field col-6">
                      <label
                        htmlFor="checkOut"
                        className="text-sm font-semibold text-900"
                      >
                        Check-out
                      </label>
                      <InputText
                        id="checkOut"
                        type="date"
                        className="w-full"
                        value={checkOutDate}
                        min={checkInDate || todayStr}
                        onChange={(e) => setCheckOutDate(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Room details card */}
                  <div className="border-1 border-300 border-round-lg p-3">
                    <p className="text-base font-semibold text-900 m-0 mt-2">
                      {selectedRoomType.name}
                    </p>
                    <p className="mt-1 text-xs text-600 m-0">
                      Capacidad: {selectedRoomType.capacity} persona(s)
                    </p>
                    <p className="mt-1 text-xs text-600 m-0">
                      Precio total por noche:{' '}
                      {roomPricingSummary.totalPerNight.toFixed(2)} USD
                    </p>
                    <p className="mt-1 text-xs text-600 m-0">
                      Exige anticipo:{' '}
                      {roomPricingSummary.requiresAdvancePayment ? 'Si' : 'No'}
                    </p>
                    <p className="mt-1 text-xs text-600 m-0">
                      Porcentaje de anticipo:{' '}
                      {roomPricingSummary.advancePaymentPercentage}%
                    </p>
                    <p className="mt-1 text-xs text-600 m-0">
                      Precio del anticipo por noche:{' '}
                      {roomPricingSummary.advanceAmountPerNight.toFixed(2)} USD
                    </p>
                    <p className="mt-3 text-sm text-700 m-0">
                      {selectedRoomType.description}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {(selectedRoomType.amenities ?? []).map((amenity: RoomAmenity) => {
                        const label = ROOM_AMENITY_GROUPS.flatMap((g) => g.options).find((o) => o.value === amenity)?.label ?? amenity;
                        return <Tag key={amenity} value={label} className="text-xs" />;
                      })}
                    </div>
                  </div>

                  {/* Availability status */}
                  <div>
                    {checkInDate && checkOutDate ? (
                      roomUnitsQuery.isLoading ? (
                        <Message
                          severity="info"
                          text="Verificando disponibilidad..."
                          className="w-full"
                        />
                      ) : hasAvailability && autoAssignedRoomUnit ? (
                        <Message
                          severity="success"
                          text={`Disponible para tus fechas. Se asignara automaticamente la habitacion ${autoAssignedRoomUnit.code}.`}
                          className="w-full"
                        />
                      ) : (
                        <Message
                          severity="error"
                          text="En las fechas seleccionadas no se encuentra disponible este tipo de habitacion."
                          className="w-full"
                        />
                      )
                    ) : (
                      <Message
                        severity="info"
                        text="Selecciona check-in y check-out para validar disponibilidad y asignar una habitacion automaticamente."
                        className="w-full"
                      />
                    )}
                  </div>

                  {bookingMessage && (
                    <Message
                      severity={isBookingSuccess ? 'success' : 'warn'}
                      text={bookingMessage}
                      className="w-full"
                    />
                  )}

                  {roomUnitsQuery.isError && (
                    <Message
                      severity="error"
                      text={getApiErrorMessage(
                        roomUnitsQuery.error,
                        'No se pudo cargar habitaciones disponibles.'
                      )}
                      className="w-full"
                    />
                  )}

                  {/* Action button */}
                  {!isAuthenticated ? (
                    <Link href={loginHref}>
                      <Button
                        label="Iniciar sesion para agendar"
                        className="w-full"
                      />
                    </Link>
                  ) : !user?.profileCompleted ? (
                    <Link href="/profile?showCompleteProfileAlert=true">
                      <Button
                        label="Completar perfil para agendar"
                        severity="warning"
                        className="w-full"
                      />
                    </Link>
                  ) : (
                    <Button
                      label={
                        createBookingMutation.isPending
                          ? 'Agendando...'
                          : 'Agendar hostal'
                      }
                      className="w-full"
                      disabled={
                        createBookingMutation.isPending ||
                        !checkInDate ||
                        !checkOutDate ||
                        roomUnitsQuery.isLoading ||
                        !hasAvailability
                      }
                      loading={createBookingMutation.isPending}
                      onClick={handleCreateBooking}
                    />
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
