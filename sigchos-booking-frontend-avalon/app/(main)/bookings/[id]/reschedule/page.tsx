'use client';

import React, { useEffect, useMemo, useState, useRef, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { getApiErrorMessage } from '@/lib/http/getApiErrorMessage';
import { getBookingById, rescheduleBooking, listPaymentsForBooking } from '@/modules/bookings/api/bookingsApi';
import type { BookingStatus } from '@/modules/bookings/types';

import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { Toast } from 'primereact/toast';

function formatMoney(value: number): string {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function addDays(value: string, days: number): string {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function calculateNights(checkInDate: string, checkOutDate: string): number {
  const start = new Date(`${checkInDate}T00:00:00Z`).getTime();
  const end = new Date(`${checkOutDate}T00:00:00Z`).getTime();
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
}

function statusLabel(status: BookingStatus): string {
  switch (status) {
    case 'PENDING': return 'Pendiente';
    case 'ADVANCE_CONFIRMED': return 'Anticipo confirmado';
    case 'COMPLETED': return 'Completada';
    case 'CANCELED': return 'Cancelada';
    default: return status;
  }
}

export default function BookingReschedulePage() {
  const params = useParams();
  const bookingId = Number(params.id);
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useRef<Toast>(null);
  
  const [mounted, setMounted] = useState(false);
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');

  useEffect(() => { setMounted(true); }, []);

  const bookingQuery = useQuery({
    queryKey: ['bookings', bookingId],
    queryFn: () => getBookingById(bookingId),
    enabled: Number.isFinite(bookingId) && mounted,
  });

  const paymentsQuery = useQuery({
    queryKey: ['payments', bookingId, 'ALL'],
    queryFn: () => listPaymentsForBooking(bookingId, 'ALL'),
    enabled: Number.isFinite(bookingId) && mounted,
  });

  const booking = bookingQuery.data;
  const hasPayments = (paymentsQuery.data?.length ?? 0) > 0;
  const keepsNightsLocked = booking ? booking.status !== 'PENDING' || hasPayments : false;

  const fixedNights = useMemo(() => booking?.nights ?? 0, [booking]);

  const computedNights = useMemo(() => {
    if (!checkInDate || !checkOutDate) return 0;
    return calculateNights(checkInDate, checkOutDate);
  }, [checkInDate, checkOutDate]);

  const suggestedCheckOutDate = useMemo(() => {
    if (!checkInDate || !fixedNights) return '';
    return addDays(checkInDate, fixedNights);
  }, [checkInDate, fixedNights]);

  useEffect(() => {
    if (!booking) return;
    if (!checkInDate) setCheckInDate(booking.checkInDate);
    if (!keepsNightsLocked && !checkOutDate) setCheckOutDate(booking.checkOutDate);
  }, [booking, checkInDate, checkOutDate, keepsNightsLocked]);

  const rescheduleMutation = useMutation({
    mutationFn: ({ bookingId: targetId, checkIn, checkOut }: { bookingId: number; checkIn: string; checkOut: string }) =>
      rescheduleBooking(targetId, { checkInDate: checkIn, checkOutDate: checkOut }),
    onSuccess: async () => {
      toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Solicitud de reagendamiento registrada correctamente.', life: 3000 });
      await queryClient.invalidateQueries({ queryKey: ['bookings'] });
      await queryClient.invalidateQueries({ queryKey: ['payments', bookingId] });
      await queryClient.invalidateQueries({ queryKey: ['bookings', bookingId] });
      setTimeout(() => {
        router.push('/bookings');
      }, 1500);
    },
    onError: (error) => {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error, 'No se pudo registrar la solicitud de reagendamiento.'), life: 5000 });
    },
  });

  const title = keepsNightsLocked ? 'Solicitud de reagendamiento' : 'Reagendar reserva';
  const helpText = keepsNightsLocked
    ? 'Esta reserva ya tiene pagos o está confirmada/completada. Debes conservar la misma cantidad de noches.'
    : 'Puedes cambiar las fechas y también la cantidad de noches mientras la nueva disponibilidad lo permita.';

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!booking) return;

    if (!checkInDate) {
      toast.current?.show({ severity: 'warn', summary: 'Advertencia', detail: 'Completa la fecha de ingreso para continuar.', life: 4000 });
      return;
    }

    const targetCheckOutDate = keepsNightsLocked ? suggestedCheckOutDate : checkOutDate;

    if (!targetCheckOutDate) {
      toast.current?.show({ severity: 'warn', summary: 'Advertencia', detail: 'Completa la fecha de salida para continuar.', life: 4000 });
      return;
    }

    const requestedNights = calculateNights(checkInDate, targetCheckOutDate);

    if (requestedNights <= 0) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'La fecha de salida debe ser posterior a la de ingreso.', life: 4000 });
      return;
    }

    if (keepsNightsLocked && requestedNights !== fixedNights) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No puedes cambiar la cantidad de noches en esta reserva. Si necesitas otra duración, cancela y crea una nueva reserva.', life: 5000 });
      return;
    }

    rescheduleMutation.mutate({
      bookingId: booking.id,
      checkIn: checkInDate,
      checkOut: targetCheckOutDate,
    });
  }

  if (!mounted) return null;

  return (
    <div className="flex flex-column gap-3">
      <Toast ref={toast} />

      <div className="card flex flex-column md:flex-row justify-content-between align-items-start gap-3">
        <div>
          <span className="text-sm font-semibold uppercase tracking-widest text-primary mb-2 block">Reagendamiento</span>
          <h2 className="m-0 text-900">{title}</h2>
          <p className="mt-2 mb-0 text-600 max-w-30rem">{helpText}</p>
        </div>
        <Button label="Volver a reservas" icon="pi pi-arrow-left" outlined onClick={() => router.push('/bookings')} />
      </div>

      {bookingQuery.isLoading && <p className="text-600">Cargando reserva...</p>}

      {bookingQuery.isError && (
        <Message severity="error" text={getApiErrorMessage(bookingQuery.error, 'No se pudo cargar la reserva.')} className="w-full justify-content-start mb-4" />
      )}

      {booking && (
        <div className="grid">
          <div className="col-12 lg:col-7 flex flex-column gap-4">
            <div className="card bg-primary-reverse border-primary surface-border mb-0">
              <span className="text-sm font-semibold uppercase tracking-widest text-primary mb-2 block">Reserva #{booking.id}</span>
              <h3 className="m-0 text-xl text-900">Hab. {booking.roomUnitCode} - {booking.roomTypeName}</h3>
              <p className="mt-2 mb-1 text-700">Estado: <span className="font-medium">{statusLabel(booking.status)}</span> | Noches actuales: <span className="font-medium">{booking.nights}</span></p>
              <p className="m-0 mb-1 text-700">Check-in: <span className="font-medium">{booking.checkInDate}</span> | Check-out: <span className="font-medium">{booking.checkOutDate}</span></p>
              <p className="m-0 text-700">Anticipo: {booking.advancePaymentPercentage}% ({formatMoney(booking.advancePaymentAmount)}) | Total: {formatMoney(booking.totalAmount)}</p>
            </div>

            {paymentsQuery.isPending && <p className="text-600">Revisando pagos registrados...</p>}

            {!paymentsQuery.isPending && hasPayments && (
              <Message 
                severity="info" 
                text={`Esta reserva ya tiene ${paymentsQuery.data?.length ?? 0} pago(s) registrado(s). Si cambias las fechas, la cantidad de noches debe permanecer igual.`} 
                className="w-full justify-content-start" 
              />
            )}

            {!paymentsQuery.isPending && booking.status === 'PENDING' && !hasPayments && (
              <Message 
                severity="success" 
                text="Todavía no hay pagos registrados. En esta solicitud sí puedes cambiar también la cantidad de noches." 
                className="w-full justify-content-start" 
              />
            )}
          </div>

          <div className="col-12 lg:col-5">
            <div className="card">
              <h4 className="m-0 mb-2 text-xl text-900">Nueva fecha</h4>
              <p className="m-0 mb-4 text-600 text-sm">
                {keepsNightsLocked
                  ? 'Selecciona un nuevo ingreso y el sistema mantendrá las mismas noches.'
                  : 'Selecciona ingreso y salida. Puedes subir o bajar noches si existe disponibilidad.'}
              </p>

              <form onSubmit={handleSubmit} className="flex flex-column gap-4">
                <div className="field mb-0">
                  <label htmlFor="checkIn" className="font-semibold text-sm uppercase text-primary">Nuevo check-in</label>
                  <InputText 
                    id="checkIn" 
                    type="date" 
                    value={checkInDate} 
                    onChange={(e) => setCheckInDate(e.target.value)} 
                    className="w-full"
                  />
                </div>

                {keepsNightsLocked ? (
                  <div className="surface-100 p-3 border-round border-dashed border-400 text-700 text-sm">
                    <p className="m-0 mb-1">Nueva salida estimada: <span className="font-semibold">{suggestedCheckOutDate || '--'}</span></p>
                    <p className="m-0">Se conservarán {fixedNights} noche(s).</p>
                  </div>
                ) : (
                  <div className="field mb-0">
                    <label htmlFor="checkOut" className="font-semibold text-sm uppercase text-primary">Nuevo check-out</label>
                    <InputText 
                      id="checkOut" 
                      type="date" 
                      value={checkOutDate} 
                      onChange={(e) => setCheckOutDate(e.target.value)} 
                      className="w-full"
                    />
                  </div>
                )}

                {!keepsNightsLocked && (
                  <p className="m-0 text-sm text-600">Noches calculadas: {computedNights > 0 ? computedNights : '--'}</p>
                )}

                <div className="mt-2">
                  <Button 
                    type="submit" 
                    label={rescheduleMutation.isPending ? 'Guardando...' : 'Guardar cambios'} 
                    icon="pi pi-check" 
                    severity="warning" 
                    disabled={rescheduleMutation.isPending || booking.status === 'CANCELED'} 
                    className="w-full md:w-auto"
                  />
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
