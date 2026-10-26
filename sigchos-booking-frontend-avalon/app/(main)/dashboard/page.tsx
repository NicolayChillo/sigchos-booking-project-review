'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/AuthContext';

import { listVisibleBookings } from '@/modules/bookings/api/bookingsApi';
import { listEstablishments } from '@/modules/establishments/api/establishmentsApi';
import { listAdminUsers } from '@/modules/users/api/adminUsersApi';
import { listMembershipRequests } from '@/modules/membershipRequests/api/membershipRequestsApi';
import { EstablishmentRequestApi } from '@/modules/establishmentRequests/api/EstablishmentRequest.api';
import { EstablishmentRequestStatusFilter } from '@/modules/establishmentRequests/enum/EstablishmentRequestStatusFilter';
import type { BookingResponse, BookingStatus } from '@/modules/bookings/types';
import type { EstablishmentResponse } from '@/modules/establishments/types';

import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';

// ─── helpers ───────────────────────────────────────────────────────────────

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

function statusLabel(status: BookingStatus) {
  const map: Record<BookingStatus, string> = {
    PENDING: 'Pendiente',
    ADVANCE_CONFIRMED: 'Anticipo confirmado',
    COMPLETED: 'Completada',
    CANCELED: 'Cancelada',
  };
  return map[status] ?? status;
}

function statusSeverity(status: BookingStatus): 'success' | 'warning' | 'danger' | 'info' | null {
  switch (status) {
    case 'PENDING': return 'warning';
    case 'ADVANCE_CONFIRMED': return 'success';
    case 'COMPLETED': return 'info';
    case 'CANCELED': return 'danger';
    default: return null;
  }
}

// ─── Stat Card ─────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  color = 'text-primary',
  bg = 'surface-100',
}: {
  label: string;
  value: string | number;
  icon: string;
  color?: string;
  bg?: string;
}) {
  return (
    <div className="col-12 sm:col-6 xl:col-3">
      <div className="card flex align-items-center gap-4 p-4">
        <div className={`${bg} border-round flex align-items-center justify-content-center`} style={{ width: '3.5rem', height: '3.5rem', flexShrink: 0 }}>
          <i className={`${icon} text-2xl ${color}`} />
        </div>
        <div>
          <p className="m-0 text-500 text-sm">{label}</p>
          <p className="m-0 text-900 text-2xl font-bold mt-1">{value}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Quick Link Card ────────────────────────────────────────────────────────

function QuickLink({
  label,
  description,
  icon,
  href,
  severity,
}: {
  label: string;
  description: string;
  icon: string;
  href: string;
  severity?: 'primary' | 'success' | 'warning' | 'info';
}) {
  const router = useRouter();
  const colorMap: Record<string, string> = {
    primary: 'text-primary',
    success: 'text-green-500',
    warning: 'text-orange-500',
    info: 'text-blue-500',
  };
  const bgMap: Record<string, string> = {
    primary: 'bg-primary-50',
    success: 'bg-green-50',
    warning: 'bg-orange-50',
    info: 'bg-blue-50',
  };
  const s = severity ?? 'primary';
  return (
    <div
      role="button"
      tabIndex={0}
      className="col-12 sm:col-6 lg:col-3 cursor-pointer"
      onClick={() => router.push(href)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          router.push(href);
        }
      }}
    >
      <div className="card h-full flex flex-column align-items-start gap-3 p-4 hover:border-primary border-1 surface-border border-round transition-colors transition-duration-200">
        <div className={`${bgMap[s]} border-round flex align-items-center justify-content-center`} style={{ width: '3rem', height: '3rem' }}>
          <i className={`${icon} text-xl ${colorMap[s]}`} />
        </div>
        <div>
          <p className="m-0 font-semibold text-900">{label}</p>
          <p className="m-0 mt-1 text-500 text-sm line-height-3">{description}</p>
        </div>
        <i className="pi pi-arrow-right text-primary mt-auto" />
      </div>
    </div>
  );
}

// ─── CLIENT DASHBOARD ───────────────────────────────────────────────────────

function ClientDashboard({ firstName }: { firstName: string }) {
  const router = useRouter();

  const { data: bookings = [], isPending } = useQuery<BookingResponse[]>({
    queryKey: ['bookings-dashboard'],
    queryFn: () => listVisibleBookings(),
  });

  const activeBookings = useMemo(
    () => bookings.filter((b: BookingResponse) => b.status === 'PENDING' || b.status === 'ADVANCE_CONFIRMED'),
    [bookings]
  );

  const nextBooking = useMemo(() => {
    return activeBookings
      .slice()
      .sort((a: BookingResponse, b: BookingResponse) => new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime())[0] ?? null;
  }, [activeBookings]);

  const totalSpent = useMemo(
    () => bookings.filter((b: BookingResponse) => b.status === 'COMPLETED').reduce((sum: number, b: BookingResponse) => sum + b.totalAmount, 0),
    [bookings]
  );

  return (
    <div className="flex flex-column gap-3">
      {/* Hero */}
      <div className="card p-5">
        <p className="text-xs font-semibold uppercase text-primary mb-2 m-0">Bienvenido</p>
        <h2 className="mt-2 mb-2 text-3xl font-bold text-900">Hola, {firstName} 👋</h2>
        <p className="m-0 text-600 line-height-3 max-w-30rem">
          Aquí tienes un resumen de tus reservas activas y accesos rápidos para gestionar tu actividad.
        </p>
      </div>

      {/* Stats */}
      <div className="grid">
        <StatCard label="Reservas activas" value={isPending ? '…' : activeBookings.length} icon="pi pi-calendar-clock" color="text-primary" bg="bg-primary-50" />
        <StatCard label="Total reservas" value={isPending ? '…' : bookings.length} icon="pi pi-list" color="text-blue-500" bg="bg-blue-50" />
        <StatCard label="Completadas" value={isPending ? '…' : bookings.filter((b: BookingResponse) => b.status === 'COMPLETED').length} icon="pi pi-check-circle" color="text-green-500" bg="bg-green-50" />
        <StatCard label="Total gastado" value={isPending ? '…' : formatMoney(totalSpent)} icon="pi pi-dollar" color="text-orange-500" bg="bg-orange-50" />
      </div>

      <div className="grid">
        {/* Próxima reserva */}
        <div className="col-12 lg:col-6">
          <div className="card h-full">
            <div className="flex justify-content-between align-items-center mb-4 border-bottom-1 surface-border pb-3">
              <h4 className="m-0 text-900">Próxima reserva</h4>
            </div>

            {isPending ? (
              <p className="text-600 m-0">Cargando...</p>
            ) : nextBooking ? (
              <div className="border-1 surface-border border-round p-4 flex flex-column gap-3">
                <div className="flex justify-content-between align-items-start gap-2">
                  <div>
                    <p className="m-0 font-semibold text-900 text-lg">Hab. {nextBooking.roomUnitCode}</p>
                    <p className="m-0 mt-1 text-600">{nextBooking.roomTypeName}</p>
                  </div>
                  <Tag severity={statusSeverity(nextBooking.status)} value={statusLabel(nextBooking.status)} />
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-600">
                  <span><i className="pi pi-calendar mr-1" />Check-in: <strong className="text-900">{nextBooking.checkInDate}</strong></span>
                  <span><i className="pi pi-calendar mr-1" />Check-out: <strong className="text-900">{nextBooking.checkOutDate}</strong></span>
                  <span><i className="pi pi-moon mr-1" />{nextBooking.nights} noches</span>
                </div>
                <div className="flex justify-content-between align-items-center pt-2 border-top-1 surface-border">
                  <span className="text-900 font-bold">{formatMoney(nextBooking.totalAmount)}</span>
                  <Button
                    label="Ver pagos"
                    icon="pi pi-dollar"
                    size="small"
                    outlined
                    onClick={() => router.push(`/bookings/${nextBooking.id}/payments`)}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center p-5 border-dashed border-1 surface-border border-round">
                <i className="pi pi-calendar text-4xl text-300 mb-3" style={{ display: 'block' }} />
                <p className="text-600 m-0">No tienes reservas activas.</p>
                <Button label="Explorar catálogo" icon="pi pi-search" className="mt-3" onClick={() => router.push('/landing')} />
              </div>
            )}
          </div>
        </div>

        {/* Últimas reservas */}
        <div className="col-12 lg:col-6">
          <div className="card h-full">
            <div className="flex justify-content-between align-items-center mb-4 border-bottom-1 surface-border pb-3">
              <h4 className="m-0 text-900">Últimas reservas</h4>
              <span className="text-600">{bookings.length} total</span>
            </div>

            {isPending ? (
              <p className="text-600 m-0">Cargando...</p>
            ) : bookings.length === 0 ? (
              <p className="text-600 m-0">Sin reservas registradas.</p>
            ) : (
              <div className="flex flex-column gap-2">
                {bookings.slice(0, 4).map((b: BookingResponse) => (
                  <div key={b.id} className="flex align-items-center justify-content-between p-3 border-1 surface-border border-round">
                    <div className="flex align-items-center gap-3">
                      <div className="surface-100 border-round flex align-items-center justify-content-center" style={{ width: '2.5rem', height: '2.5rem', flexShrink: 0 }}>
                        <i className="pi pi-home text-primary" />
                      </div>
                      <div>
                        <p className="m-0 text-sm font-semibold text-900">Hab. {b.roomUnitCode}</p>
                        <p className="m-0 text-xs text-500">{b.checkInDate} → {b.checkOutDate}</p>
                      </div>
                    </div>
                    <Tag severity={statusSeverity(b.status)} value={statusLabel(b.status)} />
                  </div>
                ))}
              </div>
            )}

            <Button
              label="Ver todas las reservas"
              icon="pi pi-arrow-right"
              iconPos="right"
              text
              className="mt-3 p-0"
              onClick={() => router.push('/bookings')}
            />
          </div>
        </div>
      </div>

      {/* Accesos rápidos */}
      <div className="card">
        <h4 className="m-0 mb-4 text-900 border-bottom-1 surface-border pb-3">Accesos rápidos</h4>
        <div className="grid">
          <QuickLink label="Mis reservas" description="Consulta y gestiona todas tus reservas activas e históricas." icon="pi pi-calendar" href="/bookings" severity="primary" />
          <QuickLink label="Explorar catálogo" description="Busca establecimientos disponibles y realiza nuevas reservas." icon="pi pi-search" href="/landing" severity="info" />
          <QuickLink label="Mi perfil" description="Actualiza tus datos personales y cambia tu contraseña." icon="pi pi-user" href="/profile" severity="success" />
          <QuickLink label="Pagos" description="Revisa el estado de los pagos de tus reservas." icon="pi pi-dollar" href="/bookings" severity="warning" />
        </div>
      </div>
    </div>
  );
}

// ─── ESTABLISHMENT ADMIN DASHBOARD ─────────────────────────────────────────

function EstablishmentAdminDashboard({ firstName }: { firstName: string }) {
  const router = useRouter();

  const { data: establishments = [], isPending: isEstPending } = useQuery<EstablishmentResponse[]>({
    queryKey: ['establishments-dashboard'],
    queryFn: listEstablishments,
  });

  const { data: bookings = [], isPending: isBookPending } = useQuery<BookingResponse[]>({
    queryKey: ['bookings-estab-dashboard'],
    queryFn: () => listVisibleBookings(),
  });

  const isPending = isEstPending || isBookPending;

  const bookingsByEstablishment = useMemo(() => {
    const map = new Map<number, BookingResponse[]>();
    for (const b of bookings) {
      if (!map.has(b.establishmentId)) map.set(b.establishmentId, []);
      map.get(b.establishmentId)!.push(b);
    }
    return map;
  }, [bookings]);

  const totalRevenue = useMemo(
    () => bookings.filter((b: BookingResponse) => b.status === 'COMPLETED').reduce((sum: number, b: BookingResponse) => sum + b.totalAmount, 0),
    [bookings]
  );

  const pendingCount = useMemo(() => bookings.filter((b: BookingResponse) => b.status === 'PENDING').length, [bookings]);
  const confirmedCount = useMemo(() => bookings.filter((b: BookingResponse) => b.status === 'ADVANCE_CONFIRMED').length, [bookings]);
  const completedCount = useMemo(() => bookings.filter((b: BookingResponse) => b.status === 'COMPLETED').length, [bookings]);

  return (
    <div className="flex flex-column gap-3">
      {/* Hero */}
      <div className="card p-5">
        <p className="text-xs font-semibold uppercase text-primary mb-2 m-0">Panel de gestión</p>
        <h2 className="mt-2 mb-2 text-3xl font-bold text-900">Bienvenido, {firstName}</h2>
        <p className="m-0 text-600 line-height-3 max-w-30rem">
          Resumen estadístico de tus establecimientos y el estado de las reservas activas.
        </p>
      </div>

      {/* Stats */}
      <div className="grid">
        <StatCard label="Establecimientos" value={isPending ? '…' : establishments.length} icon="pi pi-building" color="text-primary" bg="bg-primary-50" />
        <StatCard label="Reservas pendientes" value={isPending ? '…' : pendingCount} icon="pi pi-clock" color="text-orange-500" bg="bg-orange-50" />
        <StatCard label="Anticipo confirmado" value={isPending ? '…' : confirmedCount} icon="pi pi-check" color="text-green-500" bg="bg-green-50" />
        <StatCard label="Ingresos completados" value={isPending ? '…' : formatMoney(totalRevenue)} icon="pi pi-dollar" color="text-blue-500" bg="bg-blue-50" />
      </div>

      {/* Por establecimiento */}
      <div className="card">
        <div className="flex justify-content-between align-items-center mb-4 border-bottom-1 surface-border pb-3">
          <h4 className="m-0 text-900">Reservas por establecimiento</h4>
          <span className="text-600">{bookings.length} total</span>
        </div>

        {isPending ? (
          <p className="text-600 m-0">Cargando...</p>
        ) : establishments.length === 0 ? (
          <div className="text-center p-5 border-dashed border-1 surface-border border-round">
            <i className="pi pi-building text-4xl text-300 mb-3" style={{ display: 'block' }} />
            <p className="text-600 m-0 mb-3">No tienes establecimientos registrados.</p>
            <Button label="Crear establecimiento" icon="pi pi-plus" onClick={() => router.push('/establishments/new')} />
          </div>
        ) : (
          <div className="flex flex-column gap-3">
            {establishments.map((est: EstablishmentResponse) => {
              const estBookings = bookingsByEstablishment.get(est.id) ?? [];
              const pending = estBookings.filter((b: BookingResponse) => b.status === 'PENDING').length;
              const confirmed = estBookings.filter((b: BookingResponse) => b.status === 'ADVANCE_CONFIRMED').length;
              const completed = estBookings.filter((b: BookingResponse) => b.status === 'COMPLETED').length;
              const canceled = estBookings.filter((b: BookingResponse) => b.status === 'CANCELED').length;
              const revenue = estBookings.filter((b: BookingResponse) => b.status === 'COMPLETED').reduce((s: number, b: BookingResponse) => s + b.totalAmount, 0);

              return (
                <div key={est.id} className="border-1 surface-border border-round p-4">
                  <div className="flex flex-column md:flex-row justify-content-between align-items-start gap-3 mb-3">
                    <div className="flex align-items-center gap-3">
                      <div className="surface-100 border-round flex align-items-center justify-content-center" style={{ width: '2.75rem', height: '2.75rem', flexShrink: 0 }}>
                        <i className="pi pi-building text-primary" />
                      </div>
                      <div>
                        <p className="m-0 font-semibold text-900">{est.name}</p>
                        <p className="m-0 mt-1 text-500 text-sm">{est.address}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Tag value={est.isActive ? 'Activo' : 'Inactivo'} severity={est.isActive ? 'success' : 'danger'} />
                      <Button label="Gestionar" icon="pi pi-cog" size="small" outlined onClick={() => router.push(`/establishments/${est.id}`)} />
                    </div>
                  </div>

                  <div className="grid mt-2">
                    {[
                      { label: 'Total', value: estBookings.length, color: 'text-900' },
                      { label: 'Pendientes', value: pending, color: 'text-orange-500' },
                      { label: 'Confirmadas', value: confirmed, color: 'text-green-500' },
                      { label: 'Completadas', value: completed, color: 'text-blue-500' },
                      { label: 'Canceladas', value: canceled, color: 'text-red-400' },
                      { label: 'Ingresos', value: formatMoney(revenue), color: 'text-primary' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="col-6 sm:col-4 md:col-2">
                        <div className="surface-50 border-round p-3 text-center border-1 surface-border">
                          <p className="m-0 text-xs text-500">{label}</p>
                          <p className={`m-0 mt-1 font-bold text-lg ${color}`}>{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Accesos rápidos */}
      <div className="card">
        <h4 className="m-0 mb-4 text-900 border-bottom-1 surface-border pb-3">Accesos rápidos</h4>
        <div className="grid">
          <QuickLink label="Mis establecimientos" description="Gestiona tus propiedades, habitaciones y servicios." icon="pi pi-building" href="/establishments" severity="primary" />
          <QuickLink label="Reservas" description="Revisa y administra todas las reservas entrantes." icon="pi pi-calendar" href="/bookings" severity="info" />
          <QuickLink label="Pagos pendientes" description="Aprueba o rechaza comprobantes de pago enviados por clientes." icon="pi pi-dollar" href="/bookings" severity="warning" />
          <QuickLink label="Mi perfil" description="Actualiza tu información de cuenta y credenciales." icon="pi pi-user" href="/profile" severity="success" />
        </div>
      </div>
    </div>
  );
}

// ─── SYSTEM ADMIN DASHBOARD ─────────────────────────────────────────────────

function SystemAdminDashboard({ firstName }: { firstName: string }) {
  const router = useRouter();

  const { data: users = [], isPending: isUsersPending } = useQuery({
    queryKey: ['admin-users-dashboard'],
    queryFn: listAdminUsers,
  });

  const { data: membershipRequests = [], isPending: isMembershipPending } = useQuery({
    queryKey: ['membership-requests-dashboard'],
    queryFn: () => listMembershipRequests(),
  });

  const { data: establishmentRequestsAll = [], isPending: isEstReqPending } = useQuery({
    queryKey: ['establishment-requests-all-dashboard'],
    queryFn: () => EstablishmentRequestApi.findAll(EstablishmentRequestStatusFilter.ALL).then((r) => r.data),
  });

  const isPending = isUsersPending || isMembershipPending || isEstReqPending;

  const clientCount = useMemo(() => users.filter((u: any) => u.role === 'CLIENT').length, [users]);
  const adminCount = useMemo(() => users.filter((u: any) => u.role === 'ESTABLISHMENT_ADMIN').length, [users]);
  const pendingMemberships = useMemo(() => (membershipRequests as any[]).filter((r) => r.status === 'PENDING').length, [membershipRequests]);
  const pendingEstReqs = useMemo(() => (establishmentRequestsAll as any[]).filter((r) => r.status === 'PENDING').length, [establishmentRequestsAll]);

  const recentUsers = useMemo(() => [...users].slice(0, 5), [users]);

  return (
    <div className="flex flex-column gap-3">
      {/* Hero */}
      <div className="card p-5">
        <p className="text-xs font-semibold uppercase text-primary mb-2 m-0">Panel de administración</p>
        <h2 className="mt-2 mb-2 text-3xl font-bold text-900">Bienvenido, {firstName}</h2>
        <p className="m-0 text-600 line-height-3 max-w-30rem">
          Vista general del sistema: usuarios, solicitudes y actividad de la plataforma.
        </p>
      </div>

      {/* Stats */}
      <div className="grid">
        <StatCard label="Total usuarios" value={isPending ? '…' : users.length} icon="pi pi-users" color="text-primary" bg="bg-primary-50" />
        <StatCard label="Clientes" value={isPending ? '…' : clientCount} icon="pi pi-user" color="text-blue-500" bg="bg-blue-50" />
        <StatCard label="Admins de establecimiento" value={isPending ? '…' : adminCount} icon="pi pi-building" color="text-green-500" bg="bg-green-50" />
        <StatCard label="Solicitudes pendientes" value={isPending ? '…' : pendingMemberships + pendingEstReqs} icon="pi pi-inbox" color="text-orange-500" bg="bg-orange-50" />
      </div>

      <div className="grid">
        {/* Solicitudes de membresía */}
        <div className="col-12 lg:col-6">
          <div className="card h-full">
            <div className="flex justify-content-between align-items-center mb-4 border-bottom-1 surface-border pb-3">
              <h4 className="m-0 text-900">Solicitudes de membresía</h4>
              <span className="text-600">{(membershipRequests as any[]).length} total</span>
            </div>

            {isMembershipPending ? (
              <p className="text-600 m-0">Cargando...</p>
            ) : (membershipRequests as any[]).length === 0 ? (
              <div className="text-center p-5 border-dashed border-1 surface-border border-round">
                <i className="pi pi-inbox text-4xl text-300 mb-2" style={{ display: 'block' }} />
                <p className="text-600 m-0">Sin solicitudes de membresía.</p>
              </div>
            ) : (
              <>
                <div className="grid mb-4">
                  {[
                    { label: 'Pendientes', count: pendingMemberships, color: 'text-orange-500', bg: 'bg-orange-50' },
                    { label: 'Aprobadas', count: (membershipRequests as any[]).filter((r) => r.status === 'APPROVED').length, color: 'text-green-500', bg: 'bg-green-50' },
                    { label: 'Rechazadas', count: (membershipRequests as any[]).filter((r) => r.status === 'REJECTED').length, color: 'text-red-400', bg: 'bg-red-50' },
                  ].map(({ label, count, color, bg }) => (
                    <div key={label} className="col-4">
                      <div className={`${bg} border-round p-3 text-center`}>
                        <p className="m-0 text-xs text-500">{label}</p>
                        <p className={`m-0 mt-1 font-bold text-xl ${color}`}>{count}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-column gap-2">
                  {(membershipRequests as any[]).filter((r) => r.status === 'PENDING').slice(0, 3).map((r: any) => (
                    <div key={r.id} className="flex align-items-center justify-content-between p-3 border-1 surface-border border-round">
                      <div>
                        <p className="m-0 text-sm font-semibold text-900">{r.firstName} {r.lastName}</p>
                        <p className="m-0 text-xs text-500">{r.email} · RUC: {r.ruc}</p>
                      </div>
                      <Tag value="Pendiente" severity="warning" />
                    </div>
                  ))}
                </div>
              </>
            )}

            <Button label="Ver todas" icon="pi pi-arrow-right" iconPos="right" text className="mt-3 p-0" onClick={() => router.push('/admin')} />
          </div>
        </div>

        {/* Solicitudes de establecimiento */}
        <div className="col-12 lg:col-6">
          <div className="card h-full">
            <div className="flex justify-content-between align-items-center mb-4 border-bottom-1 surface-border pb-3">
              <h4 className="m-0 text-900">Solicitudes de establecimiento</h4>
              <span className="text-600">{establishmentRequestsAll.length} total</span>
            </div>

            {isEstReqPending ? (
              <p className="text-600 m-0">Cargando...</p>
            ) : establishmentRequestsAll.length === 0 ? (
              <div className="text-center p-5 border-dashed border-1 surface-border border-round">
                <i className="pi pi-inbox text-4xl text-300 mb-2" style={{ display: 'block' }} />
                <p className="text-600 m-0">Sin solicitudes de establecimiento.</p>
              </div>
            ) : (
              <>
                <div className="grid mb-4">
                  {[
                    { label: 'Pendientes', count: pendingEstReqs, color: 'text-orange-500', bg: 'bg-orange-50' },
                    { label: 'Aprobadas', count: (establishmentRequestsAll as any[]).filter((r) => r.status === 'APPROVED').length, color: 'text-green-500', bg: 'bg-green-50' },
                    { label: 'Rechazadas', count: (establishmentRequestsAll as any[]).filter((r) => r.status === 'REJECTED').length, color: 'text-red-400', bg: 'bg-red-50' },
                  ].map(({ label, count, color, bg }) => (
                    <div key={label} className="col-4">
                      <div className={`${bg} border-round p-3 text-center`}>
                        <p className="m-0 text-xs text-500">{label}</p>
                        <p className={`m-0 mt-1 font-bold text-xl ${color}`}>{count}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-column gap-2">
                  {(establishmentRequestsAll as any[]).filter((r) => r.status === 'PENDING').slice(0, 3).map((r: any) => (
                    <div key={r.id} className="flex align-items-center justify-content-between p-3 border-1 surface-border border-round">
                      <div>
                        <p className="m-0 text-sm font-semibold text-900">{r.name}</p>
                        <p className="m-0 text-xs text-500">{r.address}</p>
                      </div>
                      <Tag value="Pendiente" severity="warning" />
                    </div>
                  ))}
                </div>
              </>
            )}

            <Button label="Ver en establecimientos" icon="pi pi-arrow-right" iconPos="right" text className="mt-3 p-0" onClick={() => router.push('/establishments')} />
          </div>
        </div>
      </div>

      {/* Usuarios recientes */}
      <div className="card">
        <div className="flex justify-content-between align-items-center mb-4 border-bottom-1 surface-border pb-3">
          <h4 className="m-0 text-900">Usuarios registrados</h4>
          <span className="text-600">{users.length} total</span>
        </div>

        {isUsersPending ? (
          <p className="text-600 m-0">Cargando...</p>
        ) : users.length === 0 ? (
          <div className="text-center p-5 border-dashed border-1 surface-border border-round">
            <i className="pi pi-users text-4xl text-300 mb-2" style={{ display: 'block' }} />
            <p className="text-600 m-0">Sin usuarios registrados.</p>
          </div>
        ) : (
          <div className="flex flex-column gap-2">
            {recentUsers.map((u: any) => (
              <div key={u.id} className="flex align-items-center justify-content-between p-3 border-1 surface-border border-round">
                <div className="flex align-items-center gap-3">
                  <div className="surface-100 border-circle flex align-items-center justify-content-center" style={{ width: '2.5rem', height: '2.5rem', flexShrink: 0 }}>
                    <i className="pi pi-user text-500" />
                  </div>
                  <div>
                    <p className="m-0 text-sm font-semibold text-900">{u.firstName} {u.lastName}</p>
                    <p className="m-0 text-xs text-500">{u.email}</p>
                  </div>
                </div>
                <Tag
                  value={u.role === 'CLIENT' ? 'Cliente' : u.role === 'ESTABLISHMENT_ADMIN' ? 'Est. Admin' : 'Sys. Admin'}
                  severity={u.role === 'CLIENT' ? 'info' : u.role === 'ESTABLISHMENT_ADMIN' ? 'success' : null}
                />
              </div>
            ))}
          </div>
        )}

        <Button label="Gestionar usuarios" icon="pi pi-arrow-right" iconPos="right" text className="mt-3 p-0" onClick={() => router.push('/admin')} />
      </div>

      {/* Accesos rápidos */}
      <div className="card">
        <h4 className="m-0 mb-4 text-900 border-bottom-1 surface-border pb-3">Accesos rápidos</h4>
        <div className="grid">
          <QuickLink label="Panel de admin" description="Gestiona usuarios, roles y configuraciones del sistema." icon="pi pi-shield" href="/admin/users" severity="primary" />
          <QuickLink label="Solicitudes de Membresía" description="Revisa y procesa solicitudes de nuevos admins de establecimiento." icon="pi pi-id-card" href="/admin/membership-requests" severity="warning" />
          <QuickLink label="Solicitudes de Establecimientos" description="Visualiza todos los establecimientos registrados en la plataforma." icon="pi pi-building" href="/admin/establishment-requests" severity="info" />
          <QuickLink label="Mi perfil" description="Actualiza tu información de cuenta y credenciales de acceso." icon="pi pi-user" href="/profile" severity="success" />
        </div>
      </div>
    </div>
  );
}

// ─── PAGE ───────────────────────────────────────────────────────────────────

const DashboardPage = () => {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const firstName = user?.firstName?.trim().split(' ')[0] || 'Usuario';

  if (!mounted) return null;

  if (user?.role === 'CLIENT') return <ClientDashboard firstName={firstName} />;
  if (user?.role === 'ESTABLISHMENT_ADMIN') return <EstablishmentAdminDashboard firstName={firstName} />;
  if (user?.role === 'SYSTEM_ADMIN') return <SystemAdminDashboard firstName={firstName} />;

  return (
    <div className="card">
      <h2 className="m-0 text-900">Bienvenido, {firstName}</h2>
    </div>
  );
};

export default DashboardPage;
