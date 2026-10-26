'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/lib/auth/AuthContext';
import { getApiErrorMessage } from '@/lib/http/getApiErrorMessage';
import { listMembershipRequests, reviewMembershipRequest } from '@/modules/membershipRequests/api/membershipRequestsApi';
import type { MembershipRequestStatus } from '@/modules/membershipRequests/types';

import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Dialog } from 'primereact/dialog';
import { InputTextarea } from 'primereact/inputtextarea';
import { Message } from 'primereact/message';

export default function AdminMembershipRequestsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const toast = useRef<Toast>(null);
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [rejectDialogVisible, setRejectDialogVisible] = useState(false);
  const [rejectingRequestId, setRejectingRequestId] = useState<number | null>(null);
  const [reviewNote, setReviewNote] = useState('');

  useEffect(() => { setMounted(true); }, []);

  const canAccess = user?.role === 'SYSTEM_ADMIN';

  const requestsQuery = useQuery({
    queryKey: ['membership-requests'],
    queryFn: () => listMembershipRequests(),
    enabled: canAccess && mounted,
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: { status: MembershipRequestStatus; sriVerified: boolean; reviewNote?: string } }) =>
      reviewMembershipRequest(id, payload),
    onSuccess: () => {
      toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Solicitud procesada correctamente.', life: 3000 });
      queryClient.invalidateQueries({ queryKey: ['membership-requests'] });
      setRejectDialogVisible(false);
      setReviewNote('');
      setRejectingRequestId(null);
    },
    onError: (error) => {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error, 'No se pudo procesar la solicitud.'), life: 5000 });
    },
  });

  const confirmApprove = (id: number) => {
    confirmDialog({
      message: 'Al aprobar esta solicitud confirmas que has verificado el RUC manualmente en el SRI. ¿Deseas continuar?',
      header: 'Confirmar Aprobación',
      icon: 'pi pi-check-circle',
      acceptLabel: 'Sí, aprobar',
      rejectLabel: 'Cancelar',
      acceptClassName: 'p-button-success',
      accept: () => reviewMutation.mutate({ id, payload: { status: 'APPROVED', sriVerified: true } }),
    });
  };

  const openRejectDialog = (id: number) => {
    setRejectingRequestId(id);
    setReviewNote('');
    setRejectDialogVisible(true);
  };

  const handleRejectSubmit = () => {
    if (!rejectingRequestId) return;
    const note = reviewNote.trim();
    if (note.length < 5) {
      toast.current?.show({ severity: 'warn', summary: 'Atención', detail: 'El motivo de rechazo es muy corto.', life: 4000 });
      return;
    }
    reviewMutation.mutate({ id: rejectingRequestId, payload: { status: 'REJECTED', sriVerified: false, reviewNote: note } });
  };

  const statusBodyTemplate = (rowData: any) => {
    switch (rowData.status) {
      case 'APPROVED': return <Tag severity="success" value="Aprobado" />;
      case 'PENDING': return <Tag severity="warning" value="Pendiente" />;
      case 'REJECTED': return <Tag severity="danger" value="Rechazado" />;
      default: return <Tag value={rowData.status} />;
    }
  };

  const sriBodyTemplate = (rowData: any) => {
    if (rowData.status === 'APPROVED') return <Tag severity="success" value="Verificado" rounded />;
    if (rowData.status === 'REJECTED') return <Tag severity="danger" value="No verificado" rounded />;
    return <Tag severity="warning" value="Pendiente" rounded />;
  };

  const dateBodyTemplate = (rowData: any) => {
    if (!rowData.createdAt) return '—';
    return new Date(rowData.createdAt).toLocaleDateString('es-EC');
  };

  const reviewedAtBodyTemplate = (rowData: any) => {
    if (!rowData.reviewedAt) return '—';
    return new Date(rowData.reviewedAt).toLocaleDateString('es-EC');
  };

  const applicantBodyTemplate = (rowData: any) => {
    return (
      <div>
        <span className="font-semibold text-900">{rowData.firstName} {rowData.lastName}</span>
        <br />
        <span className="text-sm text-500">{rowData.email}</span>
      </div>
    );
  };

  const actionBodyTemplate = (rowData: any) => {
    if (rowData.status !== 'PENDING') return null;

    return (
      <div className="flex flex-wrap gap-2">
        <Button 
          icon="pi pi-check" 
          rounded 
          outlined 
          severity="success" 
          tooltip="Aprobar"
          disabled={reviewMutation.isPending}
          onClick={() => confirmApprove(rowData.id)} 
        />
        <Button 
          icon="pi pi-times" 
          rounded 
          outlined 
          severity="danger" 
          tooltip="Rechazar"
          disabled={reviewMutation.isPending}
          onClick={() => openRejectDialog(rowData.id)} 
        />
      </div>
    );
  };

  if (!mounted) return null;

  if (!canAccess) {
    return (
      <div className="card text-center p-5">
        <i className="pi pi-lock text-5xl text-red-500 mb-4"></i>
        <h2 className="text-900 m-0 mb-2">Acceso Denegado</h2>
        <p className="text-600 m-0">No tienes permisos para revisar solicitudes de membresía.</p>
      </div>
    );
  }

  const requests = requestsQuery.data ?? [];

  return (
    <div className="flex flex-column gap-3">
      <Toast ref={toast} />
      <ConfirmDialog />

      <Dialog 
        header="Rechazar solicitud" 
        visible={rejectDialogVisible} 
        style={{ width: '90vw', maxWidth: '400px' }} 
        onHide={() => setRejectDialogVisible(false)}
      >
        <div className="flex flex-column gap-3">
          <label htmlFor="reviewNote" className="font-medium text-900">Motivo del rechazo (obligatorio)</label>
          <InputTextarea 
            id="reviewNote" 
            value={reviewNote} 
            onChange={(e) => setReviewNote(e.target.value)} 
            rows={4} 
            placeholder="Ej: El RUC proporcionado no se encuentra activo..." 
            autoResize 
          />
          <div className="flex justify-content-end gap-2 mt-2">
            <Button label="Cancelar" icon="pi pi-times" text onClick={() => setRejectDialogVisible(false)} />
            <Button label="Rechazar solicitud" icon="pi pi-ban" severity="danger" onClick={handleRejectSubmit} loading={reviewMutation.isPending} />
          </div>
        </div>
      </Dialog>

      <div className="card flex flex-column md:flex-row justify-content-between align-items-start gap-3">
        <div>
          <h2 className="m-0 text-900">Solicitudes de membresía</h2>
          <p className="mt-2 mb-0 text-600 max-w-40rem">
            Desde aquí puedes contrastar cada petición con la información del SRI y decidir si el solicitante puede convertirse en administrador de establecimiento.
          </p>
        </div>
      </div>

      <div className="grid">
        <div className="col-12 md:col-6">
          <div className="surface-100 p-4 border-round border-1 surface-border h-full flex align-items-center gap-3">
            <i className="pi pi-search text-3xl text-primary"></i>
            <div>
              <span className="font-semibold text-900 block mb-1">Verificación manual</span>
              <span className="text-700 text-sm">Confirma el RUC y los datos antes de marcar SRI como verificado y aprobar.</span>
            </div>
          </div>
        </div>
        <div className="col-12 md:col-6">
          <div className="surface-100 p-4 border-round border-1 surface-border h-full flex align-items-center gap-3">
            <i className="pi pi-info-circle text-3xl text-primary"></i>
            <div>
              <span className="font-semibold text-900 block mb-1">Rechazos</span>
              <span className="text-700 text-sm">Deja una nota clara para que el equipo o el solicitante entiendan el motivo.</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex justify-content-between align-items-center mb-4">
          <h3 className="m-0 text-900 text-xl">Bandeja de solicitudes</h3>
          <span className="text-500">{requests.length} registros</span>
        </div>

        {requestsQuery.isError && (
          <Message severity="error" text={getApiErrorMessage(requestsQuery.error, 'No se pudo cargar el listado de solicitudes.')} className="w-full justify-content-start mb-4" />
        )}

        <DataTable 
          value={requests} 
          loading={requestsQuery.isLoading} 
          emptyMessage="No hay solicitudes pendientes o procesadas."
          paginator 
          rows={10} 
          rowsPerPageOptions={[5, 10, 25]}
          stripedRows
          responsiveLayout="scroll"
          sortField="createdAt"
          sortOrder={-1}
        >
          <Column header="Solicitante" body={applicantBodyTemplate} sortable sortField="firstName" />
          <Column field="ruc" header="RUC" />
          <Column header="Fecha solicitud" body={dateBodyTemplate} sortable sortField="createdAt" />
          <Column header="Estado" body={statusBodyTemplate} sortable sortField="status" />
          <Column header="SRI" body={sriBodyTemplate} />
          <Column header="Fecha revisión" body={reviewedAtBodyTemplate} />
          <Column field="reviewNote" header="Nota" style={{ maxWidth: '15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} />
          <Column body={actionBodyTemplate} exportable={false} style={{ minWidth: '8rem' }} />
        </DataTable>
      </div>
    </div>
  );
}
