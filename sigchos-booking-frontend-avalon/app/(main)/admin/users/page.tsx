'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { getApiErrorMessage } from '@/lib/http/getApiErrorMessage';
import { deleteAdminUser, listAdminUsers, restoreAdminUser } from '@/modules/users/api/adminUsersApi';

import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';

export default function AdminUsersPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const toast = useRef<Toast>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const canAccessAdminUsers = user?.role === 'SYSTEM_ADMIN';

  const usersQuery = useQuery({
    queryKey: ['admin-users'],
    queryFn: listAdminUsers,
    enabled: canAccessAdminUsers && mounted,
  });

  const users = usersQuery.data ?? [];

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteAdminUser(id),
    onSuccess: () => {
      toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Usuario desactivado correctamente.', life: 3000 });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error) => {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error, 'No se pudo desactivar el usuario.'), life: 5000 });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: number) => restoreAdminUser(id),
    onSuccess: () => {
      toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Usuario restaurado correctamente.', life: 3000 });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error) => {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error, 'No se pudo restaurar el usuario.'), life: 5000 });
    },
  });

  const confirmDelete = (rowData: any) => {
    const isEstablishmentAdmin = rowData.role === 'ESTABLISHMENT_ADMIN';
    confirmDialog({
      message: (
        <span>
          ¿Estás seguro de que deseas desactivar este usuario?
          {isEstablishmentAdmin && (
            <>
              <br />
              Sus establecimientos, habitaciones y servicios asociados también serán desactivados automáticamente.
            </>
          )}
        </span>
      ),
      header: 'Confirmar desactivación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, desactivar',
      rejectLabel: 'No, cancelar',
      acceptClassName: 'p-button-danger',
      accept: () => deleteMutation.mutate(rowData.id),
    });
  };

  const confirmRestore = (rowData: any) => {
    const isEstablishmentAdmin = rowData.role === 'ESTABLISHMENT_ADMIN';
    confirmDialog({
      message: (
        <span>
          ¿Estás seguro de que deseas restaurar este usuario?
          {isEstablishmentAdmin && (
            <>
              <br />
              Deberás notificarle que debe reactivar los establecimientos, habitaciones y servicios que desee.
            </>
          )}
        </span>
      ),
      header: 'Confirmar restauración',
      icon: 'pi pi-info-circle',
      acceptLabel: 'Sí, restaurar',
      rejectLabel: 'No, cancelar',
      acceptClassName: 'p-button-success',
      accept: () => restoreMutation.mutate(rowData.id),
    });
  };

  const statusBodyTemplate = (rowData: any) => {
    return <Tag severity={rowData.active ? 'success' : 'danger'} value={rowData.active ? 'Activo' : 'Inactivo'} />;
  };

  const nameBodyTemplate = (rowData: any) => {
    return (
      <div>
        <span className="font-semibold text-900">{rowData.firstName} {rowData.lastName}</span>
        <br />
        <span className="text-sm text-500">{rowData.email}</span>
      </div>
    );
  };

  const actionBodyTemplate = (rowData: any) => {
    const isCurrentLoggedUser = rowData.id === user?.id;

    return (
      <div className="flex flex-wrap gap-2">
        <Button 
          icon="pi pi-pencil" 
          rounded 
          outlined 
          className="mr-2" 
          tooltip="Editar"
          onClick={() => router.push(`/admin/users/${rowData.id}/edit`)} 
        />
        {rowData.active ? (
          <Button 
            icon="pi pi-ban" 
            rounded 
            outlined 
            severity="danger" 
            tooltip={isCurrentLoggedUser ? "No puedes desactivarte a ti mismo" : "Desactivar"}
            disabled={isCurrentLoggedUser || deleteMutation.isPending}
            onClick={() => confirmDelete(rowData)} 
          />
        ) : (
          <Button 
            icon="pi pi-check-circle" 
            rounded 
            outlined 
            severity="success" 
            tooltip="Restaurar"
            disabled={restoreMutation.isPending}
            onClick={() => confirmRestore(rowData)} 
          />
        )}
      </div>
    );
  };

  if (!mounted) return null;

  if (!canAccessAdminUsers) {
    return (
      <div className="card text-center p-5">
        <i className="pi pi-lock text-5xl text-red-500 mb-4"></i>
        <h2 className="text-900 m-0 mb-2">Acceso Denegado</h2>
        <p className="text-600 m-0">No tienes permisos para acceder al panel de administración de usuarios.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-column gap-3">
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="card flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center gap-3">
        <div>
          <h2 className="m-0 text-900">Panel de gestión de usuarios</h2>
          <p className="mt-2 mb-0 text-600">
            Listado general con acciones de gestión para crear, editar y administrar usuarios.
          </p>
        </div>
        <Button label="Crear usuario" icon="pi pi-plus" onClick={() => router.push('/admin/users/new')} />
      </div>

      <div className="card">
        <div className="flex justify-content-between align-items-center mb-4">
          <h3 className="m-0 text-900 text-xl">Listado</h3>
          <span className="text-500">{users.length} registros</span>
        </div>

        <DataTable 
          value={users} 
          loading={usersQuery.isLoading} 
          emptyMessage="No hay usuarios registrados todavía."
          paginator 
          rows={10} 
          rowsPerPageOptions={[5, 10, 25, 50]}
          stripedRows
          responsiveLayout="scroll"
        >
          <Column field="id" header="ID" sortable style={{ width: '5rem' }} />
          <Column header="Usuario" body={nameBodyTemplate} sortable sortField="firstName" />
          <Column field="role" header="Rol" sortable />
          <Column field="phone" header="Teléfono" />
          <Column header="Estado" body={statusBodyTemplate} sortable sortField="active" />
          <Column body={actionBodyTemplate} exportable={false} style={{ minWidth: '8rem' }} />
        </DataTable>
      </div>
    </div>
  );
}
