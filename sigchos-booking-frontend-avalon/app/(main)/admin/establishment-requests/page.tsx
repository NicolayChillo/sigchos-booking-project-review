'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/lib/auth/AuthContext';
import { getApiErrorMessage } from '@/lib/http/getApiErrorMessage';
import { useEstablishmentRequestList } from '@/modules/establishmentRequests/hooks/useEstablishmentRequestList';
import { useEstablishmentRequestMutation } from '@/modules/establishmentRequests/hooks/useEstablishmentRequestMutation';
import { EstablishmentRequestStatusFilter } from '@/modules/establishmentRequests/enum/EstablishmentRequestStatusFilter';
import { EstablishmentRequestStatusLabel, EstablishmentRequestStatus } from '@/modules/establishmentRequests/enum/EstablishmentRequestStatus';

import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Dialog } from 'primereact/dialog';
import { InputTextarea } from 'primereact/inputtextarea';
import { Message } from 'primereact/message';
import { Dropdown } from 'primereact/dropdown';

export default function AdminEstablishmentRequestsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const toast = useRef<Toast>(null);
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<EstablishmentRequestStatusFilter>(EstablishmentRequestStatusFilter.PENDING);
  const [rejectDialogVisible, setRejectDialogVisible] = useState(false);
  const [rejectingRequestId, setRejectingRequestId] = useState<number | null>(null);
  const [reviewNote, setReviewNote] = useState('');

  useEffect(() => { setMounted(true); }, []);

  const canAccess = user?.role === 'SYSTEM_ADMIN';

  const { data: requests, isPending: isQueryPending, error: queryError } = useEstablishmentRequestList({
    filter,
  });

  const { review, isMutationPending, mutationError } = useEstablishmentRequestMutation();

  const filterOptions = Object.entries(EstablishmentRequestStatusFilter).map(([key, value]) => ({
    label: key === 'ALL' ? 'Todos' : EstablishmentRequestStatusLabel[value as EstablishmentRequestStatus] || value,
    value: value,
  }));

  const handleReviewAction = async (id: number, status: EstablishmentRequestStatus, note: string | null) => {
    try {
      await review({ id, dto: { status, reviewNote: note } });
      toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Solicitud procesada correctamente.', life: 3000 });
      setRejectDialogVisible(false);
      setReviewNote('');
      setRejectingRequestId(null);
    } catch (error: any) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error, 'No se pudo procesar la solicitud.'), life: 5000 });
    }
  };

  const confirmApprove = (id: number) => {
    confirmDialog({
      message: 'Al aprobar esta solicitud confirmas que has verificado la información del establecimiento y el certificado del SRI. ¿Deseas continuar?',
      header: 'Confirmar Aprobación',
      icon: 'pi pi-check-circle',
      acceptLabel: 'Sí, aprobar',
      rejectLabel: 'Cancelar',
      acceptClassName: 'p-button-success',
      accept: () => handleReviewAction(id, EstablishmentRequestStatus.APPROVED, null),
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
    handleReviewAction(rejectingRequestId, EstablishmentRequestStatus.REJECTED, note);
  };

  const statusBodyTemplate = (rowData: any) => {
    switch (rowData.status) {
      case EstablishmentRequestStatus.APPROVED: return <Tag severity="success" value="Aprobado" />;
      case EstablishmentRequestStatus.PENDING: return <Tag severity="warning" value="Pendiente" />;
      case EstablishmentRequestStatus.REJECTED: return <Tag severity="danger" value="Rechazado" />;
      default: return <Tag value={rowData.status} />;
    }
  };

  const dateBodyTemplate = (rowData: any) => {
    if (!rowData.createdAt) return '—';
    return new Date(rowData.createdAt).toLocaleDateString('es-EC');
  };

  const applicantBodyTemplate = (rowData: any) => {
    return (
      <div>
        <span className="font-semibold text-900">{rowData.requestedBy?.firstName} {rowData.requestedBy?.lastName}</span>
        <br />
        <span className="text-sm text-500">{rowData.requestedBy?.email}</span>
      </div>
    );
  };

  const certBodyTemplate = (rowData: any) => {
    if (!rowData.certificateUrl) return '—';
    return (
      <Button 
        icon="pi pi-external-link" 
        label="Ver certificado" 
        size="small" 
        text 
        onClick={() => window.open(rowData.certificateUrl, '_blank')} 
      />
    );
  };

  const actionBodyTemplate = (rowData: any) => {
    if (rowData.status !== EstablishmentRequestStatus.PENDING) return null;

    return (
      <div className="flex flex-wrap gap-2">
        <Button 
          icon="pi pi-check" 
          rounded 
          outlined 
          severity="success" 
          tooltip="Aprobar"
          disabled={isMutationPending}
          onClick={() => confirmApprove(rowData.id)} 
        />
        <Button 
          icon="pi pi-times" 
          rounded 
          outlined 
          severity="danger" 
          tooltip="Rechazar"
          disabled={isMutationPending}
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
        <p className="text-600 m-0">No tienes permisos para revisar solicitudes de establecimientos.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-column gap-3">
      <Toast ref={toast} />
      <ConfirmDialog />

      <Dialog 
        header="Rechazar solicitud de establecimiento" 
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
            placeholder="Ej: El certificado SRI no coincide con el solicitante..." 
            autoResize 
          />
          <div className="flex justify-content-end gap-2 mt-2">
            <Button label="Cancelar" icon="pi pi-times" text onClick={() => setRejectDialogVisible(false)} />
            <Button label="Rechazar solicitud" icon="pi pi-ban" severity="danger" onClick={handleRejectSubmit} loading={isMutationPending} />
          </div>
        </div>
      </Dialog>

      <div className="card flex flex-column md:flex-row justify-content-between align-items-start gap-3">
        <div>
          <h2 className="m-0 text-900">Revisión de solicitudes de establecimientos</h2>
          <p className="mt-2 mb-0 text-600 max-w-40rem">
            Desde aquí puedes revisar cada solicitud de establecimiento y decidir si se aprueba o se rechaza.
          </p>
        </div>
      </div>

      <div className="grid">
        <div className="col-12 md:col-6">
          <div className="surface-100 p-4 border-round border-1 surface-border h-full flex align-items-center gap-3">
            <i className="pi pi-search text-3xl text-primary"></i>
            <div>
              <span className="font-semibold text-900 block mb-1">Revisión manual</span>
              <span className="text-700 text-sm">Verifica la información del solicitante y el certificado del SRI antes de aprobar.</span>
            </div>
          </div>
        </div>
        <div className="col-12 md:col-6">
          <div className="surface-100 p-4 border-round border-1 surface-border h-full flex align-items-center gap-3">
            <i className="pi pi-info-circle text-3xl text-primary"></i>
            <div>
              <span className="font-semibold text-900 block mb-1">Rechazos</span>
              <span className="text-700 text-sm">Deja una nota clara para que el solicitante entienda el motivo del rechazo.</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center gap-4 mb-4">
          <div>
            <h3 className="m-0 text-900 text-xl">Bandeja de solicitudes</h3>
            <span className="text-500">{requests?.length ?? 0} registros</span>
          </div>

          <Dropdown 
            value={filter} 
            options={filterOptions} 
            onChange={(e) => setFilter(e.value)} 
            className="w-full md:w-15rem" 
          />
        </div>

        {queryError && (
          <Message severity="error" text={getApiErrorMessage(queryError, 'No se pudo cargar el listado de solicitudes.')} className="w-full justify-content-start mb-4" />
        )}

        <DataTable 
          value={requests} 
          loading={isQueryPending} 
          emptyMessage="No hay solicitudes para mostrar con este filtro."
          paginator 
          rows={10} 
          rowsPerPageOptions={[5, 10, 25]}
          stripedRows
          responsiveLayout="scroll"
          sortField="createdAt"
          sortOrder={-1}
        >
          <Column header="Establecimiento" field="name" sortable style={{ fontWeight: 'bold' }} />
          <Column header="Solicitante" body={applicantBodyTemplate} />
          <Column field="address" header="Dirección" style={{ maxWidth: '12rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} />
          <Column header="Fecha solicitud" body={dateBodyTemplate} sortable sortField="createdAt" />
          <Column header="Estado" body={statusBodyTemplate} sortable sortField="status" />
          <Column header="Certificado" body={certBodyTemplate} />
          <Column field="reviewNote" header="Nota" style={{ maxWidth: '12rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} />
          <Column body={actionBodyTemplate} exportable={false} style={{ minWidth: '8rem' }} />
        </DataTable>
      </div>
    </div>
  );
}
