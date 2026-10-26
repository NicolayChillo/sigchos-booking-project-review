'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { getApiErrorMessage } from '@/lib/http/getApiErrorMessage';
import { cancelBooking, listBookingHistory, listVisibleBookings } from '@/modules/bookings/api/bookingsApi';
import { BOOKING_STATUS_OPTIONS, type BookingResponse, type BookingStatus } from '@/modules/bookings/types';

import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { Message } from 'primereact/message';
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog';

type BookingView = 'CURRENT' | 'HISTORY';

function formatMoney(value: number): string {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('es-EC', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function statusBadgeSeverity(status: BookingStatus): 'success' | 'warning' | 'danger' | 'info' | null {
  switch (status) {
    case 'PENDING':
      return 'warning';
    case 'ADVANCE_CONFIRMED':
      return 'success';
    case 'COMPLETED':
      return 'info';
    case 'CANCELED':
      return 'danger';
    default:
      return null;
  }
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

function buildCancellationSummary(booking: BookingResponse) {
  const hasPolicy = booking.cancelPenaltyAfterEnabled;

  if (!hasPolicy) {
    return {
      penaltyPercentage: 0,
      penaltyAmount: 0,
      refundAmount: booking.advancePaymentAmount,
      detail: 'No se aplica penalización según la política del establecimiento.',
    };
  }

  const checkInDateTime = new Date(`${booking.checkInDate}T00:00:00`);
  const now = new Date();
  const hoursUntilCheckIn = (checkInDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  const windowHours = booking.cancelPenaltyWindowHours ?? 24;

  const isAfterWindow = hoursUntilCheckIn < windowHours;
  const penaltyPercentage = isAfterWindow ? (booking.cancelPenaltyAfterPercentage ?? 0) : 0;
  const penaltyAmount = Number((booking.advancePaymentAmount * (penaltyPercentage / 100)).toFixed(2));
  const refundAmount = Number((booking.advancePaymentAmount - penaltyAmount).toFixed(2));
  const detail = isAfterWindow
    ? `Cancelación dentro del tramo de menos de ${windowHours}h de anticipación.`
    : `Cancelación dentro del tramo de ${windowHours}h o más de anticipación, sin penalización.`;

  return { penaltyPercentage, penaltyAmount, refundAmount, detail };
}

export default function BookingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const toast = useRef<Toast>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const [view, setView] = useState<BookingView>('CURRENT');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'ALL'>('ALL');

  const bookingsQuery = useQuery({
    queryKey: ['bookings', view, statusFilter],
    queryFn: () => {
      if (view === 'HISTORY') return listBookingHistory();
      return listVisibleBookings(statusFilter === 'ALL' ? undefined : statusFilter);
    },
    enabled: mounted,
  });

  const cancelMutation = useMutation({
    mutationFn: cancelBooking,
    onSuccess: (booking) => {
      const summary = buildCancellationSummary(booking);
      toast.current?.show({
        severity: 'success',
        summary: 'Reserva cancelada',
        detail: `Penalización: ${summary.penaltyPercentage}% (${formatMoney(summary.penaltyAmount)}). Devolución estimada: ${formatMoney(summary.refundAmount)}. ${summary.detail}`,
        life: 6000,
      });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: (error) => {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error, 'No se pudo cancelar la reserva.'), life: 5000 });
    },
  });

  const bookings = useMemo(() => bookingsQuery.data ?? [], [bookingsQuery.data]);

  const bookingSequenceById = useMemo(() => {
    const counts = new Map<number, number>();
    const sequences = new Map<number, number>();
    bookings.forEach((booking: BookingResponse) => {
      const current = (counts.get(booking.establishmentId) ?? 0) + 1;
      counts.set(booking.establishmentId, current);
      sequences.set(booking.id, current);
    });
    return sequences;
  }, [bookings]);

  const roleDescription = useMemo(() => {
    switch (user?.role) {
      case 'CLIENT': return 'Visualiza y gestiona tus reservas.';
      case 'ESTABLISHMENT_ADMIN': return 'Visualiza reservas de tus establecimientos.';
      default: return 'Gestión de reservas.';
    }
  }, [user?.role]);

  const confirmCancellation = (booking: BookingResponse) => {
    const summary = buildCancellationSummary(booking);
    confirmDialog({
      message: (
        <div className="flex flex-column gap-3">
          <div><strong>Política de cancelación:</strong><br />{booking.cancellationPolicy}</div>
          <div><strong>Penalización estimada:</strong> {summary.penaltyPercentage}% ({formatMoney(summary.penaltyAmount)})</div>
          <div><strong>Devolución estimada del anticipo:</strong> {formatMoney(summary.refundAmount)}</div>
          <p className="mt-2 text-red-500 font-semibold">¿Deseas continuar con la cancelación?</p>
        </div>
      ),
      header: 'Confirmar cancelación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, cancelar reserva',
      rejectLabel: 'No, mantener reserva',
      acceptClassName: 'p-button-danger',
      accept: () => cancelMutation.mutate(booking.id),
    });
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-column gap-3">
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="card flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center gap-3">
        <div>
          <h2 className="m-0 text-900">Panel de reservas</h2>
          <p className="mt-2 mb-0 text-600">{roleDescription}</p>
        </div>
        <Button label="Ver catálogo público" icon="pi pi-search" outlined onClick={() => router.push('/landing')} />
      </div>

      <div className="card">
        <div className="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center gap-4 mb-4 border-bottom-1 surface-border pb-4">
          <div>
            <h3 className="m-0 text-900 text-xl">Listado de reservas</h3>
            <p className="mt-1 mb-0 text-600">{bookings.length} registros</p>
          </div>

          <div className="flex flex-wrap align-items-center gap-3">
            <div className="p-selectbutton p-buttonset">
              <Button label="Vista actual" onClick={() => setView('CURRENT')} className={view === 'CURRENT' ? 'p-button-primary' : 'p-button-outlined p-button-secondary'} />
              <Button label="Historial" onClick={() => setView('HISTORY')} className={view === 'HISTORY' ? 'p-button-primary' : 'p-button-outlined p-button-secondary'} />
            </div>

            <Dropdown
              value={statusFilter}
              options={BOOKING_STATUS_OPTIONS as any}
              optionLabel="label"
              optionValue="value"
              onChange={(e) => setStatusFilter(e.value)}
              disabled={view === 'HISTORY'}
              className="w-14rem"
            />
          </div>
        </div>

        {bookingsQuery.isLoading && <p className="text-600">Cargando reservas...</p>}

        {bookingsQuery.isError && (
          <Message severity="error" text={getApiErrorMessage(bookingsQuery.error, 'No se pudo cargar el listado de reservas.')} className="w-full justify-content-start mb-4" />
        )}

        <div className="flex flex-column gap-4">
          {bookings.map((booking: BookingResponse, index: number) => {
            const bookingSequence = bookingSequenceById.get(booking.id) ?? index + 1;

            return (
              <div key={booking.id} className="border-1 surface-border border-round p-4 flex flex-column gap-3">
                <div className="flex flex-column md:flex-row justify-content-between align-items-start gap-3">
                  <div>
                    <div className="flex align-items-center gap-2 mb-2">
                      <h4 className="m-0 text-lg text-900">Reserva #{bookingSequence} - Hab. {booking.roomUnitCode}</h4>
                      <Tag severity={statusBadgeSeverity(booking.status) as any} value={statusLabel(booking.status)} />
                    </div>
                    <p className="m-0 mt-2 text-700">Establecimiento: #{booking.establishmentId} | Tipo: {booking.roomTypeName}</p>
                    <p className="m-0 mt-1 text-600">Check-in: {booking.checkInDate} | Check-out: {booking.checkOutDate} | Noches: {booking.nights}</p>
                    <p className="m-0 mt-1 text-600">Total: {formatMoney(booking.totalAmount)} | Anticipo: {booking.advancePaymentPercentage}% ({formatMoney(booking.advancePaymentAmount)})</p>
                    <p className="m-0 mt-1 text-500 text-sm">Creada: {formatDateTime(booking.createdAt)}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button label="Pagos" icon="pi pi-dollar" outlined size="small" onClick={() => router.push(`/bookings/${booking.id}/payments`)} />
                    
                    {booking.status !== 'CANCELED' && (
                      <Button 
                        label="Cancelar" 
                        icon="pi pi-times" 
                        outlined 
                        severity="danger" 
                        size="small" 
                        onClick={() => confirmCancellation(booking)} 
                        loading={cancelMutation.isPending} 
                      />
                    )}
                  </div>
                </div>

                {booking.status !== 'CANCELED' && (
                  <div className="mt-2 pt-3 border-top-1 surface-border flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center gap-3">
                    <div className="text-sm text-600 max-w-30rem">
                      <span className="font-semibold text-700">Política de cancelación:</span><br/>
                      {booking.cancellationPolicy}
                    </div>
                    <Button label="Reagendar" icon="pi pi-calendar" outlined severity="warning" size="small" onClick={() => router.push(`/bookings/${booking.id}/reschedule`)} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!bookingsQuery.isLoading && !bookingsQuery.isError && bookings.length === 0 && (
          <div className="text-center p-5 border-dashed border-1 surface-border border-round">
            <p className="text-600 m-0">No hay reservas para mostrar en esta vista.</p>
          </div>
        )}
      </div>
    </div>
  );
}
