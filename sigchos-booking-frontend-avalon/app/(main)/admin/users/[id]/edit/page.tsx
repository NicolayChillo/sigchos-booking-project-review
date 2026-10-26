'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { useRouter, useParams } from 'next/navigation';
import { z } from 'zod';

import { useAuth } from '@/lib/auth/AuthContext';
import { getApiErrorMessage } from '@/lib/http/getApiErrorMessage';
import { listAdminUsers, updateAdminUser } from '@/modules/users/api/adminUsersApi';
import { ADMIN_USER_ROLES, type AdminUpdateUserRequest } from '@/modules/users/types';
import { validateEcuadorRuc } from '@/lib/validators/validateEcuadorRuc';

import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Message } from 'primereact/message';
import { classNames } from 'primereact/utils';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const editSchema = z.object({
  firstName: z.string().trim().min(1, 'Campo obligatorio.'),
  lastName: z.string().trim().min(1, 'Campo obligatorio.'),
  email: z.string().trim().email('Correo inválido.'),
  password: z.string().trim()
    .refine(
      value => value.length === 0 || /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,100}$/.test(value),
      'Si cambias la contraseña, debe incluir mayúscula, minúscula y número (mín. 8 caracteres).'
    )
    .optional().or(z.literal('')),
  phone: z.string().trim().min(1, 'Campo obligatorio.'),
  ruc: z.string(),
  birthDate: z.string().trim().regex(dateRegex, 'Formato esperado: YYYY-MM-DD'),
  role: z.enum(['CLIENT', 'ESTABLISHMENT_ADMIN', 'SYSTEM_ADMIN']),
  active: z.boolean(),
}).superRefine((data, ctx) => {
  if (data.role !== 'ESTABLISHMENT_ADMIN') return;
  const r = data.ruc.trim();
  if (r === '') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'El RUC es obligatorio para administrador de establecimiento.',
      path: ['ruc'],
    });
    return;
  }
  if (!/^\d{13}$/.test(r)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'El RUC debe tener exactamente 13 dígitos numéricos.',
      path: ['ruc'],
    });
    return;
  }
  if (!validateEcuadorRuc(r)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'El RUC no es válido. Verifica que sea un RUC ecuatoriano correcto.',
      path: ['ruc'],
    });
  }
});

type EditFormValues = z.infer<typeof editSchema>;

function normalizeUpdatePayload(values: EditFormValues): AdminUpdateUserRequest {
  const password = values.password?.trim();
  const rucTrim = values.ruc.trim();

  return {
    firstName: values.firstName,
    lastName: values.lastName,
    email: values.email,
    phone: values.phone,
    birthDate: values.birthDate,
    role: values.role,
    active: values.active,
    ...(password ? { password } : {}),
    ...(rucTrim !== '' ? { ruc: rucTrim } : {}),
  };
}

export default function AdminUserEditPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const targetUserId = Number(params.id);
  const queryClient = useQueryClient();
  const toast = useRef<Toast>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const canAccessAdminUsers = user?.role === 'SYSTEM_ADMIN';

  const usersQuery = useQuery({
    queryKey: ['admin-users'],
    queryFn: listAdminUsers,
    enabled: canAccessAdminUsers && mounted,
  });

  const targetUser = useMemo(() => {
    if (!Number.isFinite(targetUserId)) return null;
    return (usersQuery.data ?? []).find((item: any) => item.id === targetUserId) ?? null;
  }, [targetUserId, usersQuery.data]);

  const isEditingCurrentUser = targetUser?.id === user?.id;

  const { control, handleSubmit, watch, reset, formState: { errors } } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
      ruc: '',
      birthDate: '',
      role: 'CLIENT',
      active: true,
    },
  });

  useEffect(() => {
    if (!targetUser) return;
    reset({
      firstName: targetUser.firstName,
      lastName: targetUser.lastName,
      email: targetUser.email,
      password: '',
      phone: targetUser.phone,
      ruc: targetUser.ruc ?? '',
      birthDate: targetUser.birthDate,
      role: targetUser.role as any,
      active: targetUser.active,
    });
  }, [reset, targetUser]);

  const updateMutation = useMutation({
    mutationFn: (payload: AdminUpdateUserRequest) => updateAdminUser(targetUserId, payload),
    onSuccess: () => {
      toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Usuario actualizado correctamente.', life: 3000 });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setTimeout(() => {
        router.push('/admin/users');
      }, 1500);
    },
    onError: (error) => {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error, 'No se pudo actualizar el usuario.'), life: 5000 });
    },
  });

  const onSubmit = (values: EditFormValues) => {
    updateMutation.mutate(
      normalizeUpdatePayload({
        ...values,
        active: isEditingCurrentUser ? true : values.active,
      })
    );
  };

  const selectedRole = watch('role');

  if (!mounted) return null;

  if (!canAccessAdminUsers) {
    return (
      <div className="card text-center p-5">
        <i className="pi pi-lock text-5xl text-red-500 mb-4"></i>
        <h2 className="text-900 m-0 mb-2">Acceso Denegado</h2>
        <p className="text-600 m-0">No tienes permisos para editar usuarios administrados.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-column gap-3">
      <Toast ref={toast} />

      <div className="card flex flex-column md:flex-row justify-content-between align-items-start gap-3">
        <div>
          <h2 className="m-0 text-900">Editar usuario</h2>
          <p className="mt-2 mb-0 text-600">Actualiza la información y permisos del usuario seleccionado.</p>
        </div>
        <Button label="Volver al listado" icon="pi pi-arrow-left" outlined onClick={() => router.push('/admin/users')} />
      </div>

      {usersQuery.isLoading && <p className="text-600">Cargando usuario...</p>}

      {usersQuery.isError && (
        <Message severity="error" text={getApiErrorMessage(usersQuery.error, 'No se pudo cargar el usuario.')} className="w-full justify-content-start mb-4" />
      )}

      {!usersQuery.isLoading && !targetUser && !usersQuery.isError && (
        <Message severity="warn" text="Usuario no encontrado." className="w-full justify-content-start mb-4" />
      )}

      {targetUser && (
        <div className="card">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="p-fluid grid">
            <div className="field col-12 md:col-6">
              <label htmlFor="firstName" className="font-semibold">Nombres</label>
              <Controller name="firstName" control={control} render={({ field, fieldState }) => (
                <>
                  <InputText id={field.name} {...field} className={classNames({ 'p-invalid': fieldState.invalid })} />
                  {fieldState.error && <small className="p-error">{fieldState.error.message}</small>}
                </>
              )} />
            </div>

            <div className="field col-12 md:col-6">
              <label htmlFor="lastName" className="font-semibold">Apellidos</label>
              <Controller name="lastName" control={control} render={({ field, fieldState }) => (
                <>
                  <InputText id={field.name} {...field} className={classNames({ 'p-invalid': fieldState.invalid })} />
                  {fieldState.error && <small className="p-error">{fieldState.error.message}</small>}
                </>
              )} />
            </div>

            <div className="field col-12 md:col-6">
              <label htmlFor="email" className="font-semibold">Correo</label>
              <Controller name="email" control={control} render={({ field, fieldState }) => (
                <>
                  <InputText id={field.name} type="email" {...field} className={classNames({ 'p-invalid': fieldState.invalid })} />
                  {fieldState.error && <small className="p-error">{fieldState.error.message}</small>}
                </>
              )} />
            </div>

            <div className="field col-12 md:col-6">
              <label htmlFor="password" className="font-semibold">Contraseña (opcional)</label>
              <Controller name="password" control={control} render={({ field, fieldState }) => (
                <>
                  <Password id={field.name} {...field} toggleMask feedback={false} className={classNames({ 'p-invalid': fieldState.invalid })} />
                  {fieldState.error && <small className="p-error">{fieldState.error.message}</small>}
                </>
              )} />
            </div>

            <div className="field col-12 md:col-6">
              <label htmlFor="phone" className="font-semibold">Teléfono</label>
              <Controller name="phone" control={control} render={({ field, fieldState }) => (
                <>
                  <InputText id={field.name} {...field} className={classNames({ 'p-invalid': fieldState.invalid })} />
                  {fieldState.error && <small className="p-error">{fieldState.error.message}</small>}
                </>
              )} />
            </div>

            <div className="field col-12 md:col-6">
              <label htmlFor="birthDate" className="font-semibold">Fecha de nacimiento</label>
              <Controller name="birthDate" control={control} render={({ field, fieldState }) => (
                <>
                  <InputText id={field.name} type="date" {...field} className={classNames({ 'p-invalid': fieldState.invalid })} />
                  {fieldState.error && <small className="p-error">{fieldState.error.message}</small>}
                </>
              )} />
            </div>

            <div className="field col-12 md:col-6">
              <label htmlFor="role" className="font-semibold">Rol</label>
              <Controller name="role" control={control} render={({ field, fieldState }) => (
                <>
                  <Dropdown id={field.name} value={field.value} onChange={(e) => field.onChange(e.value)} options={ADMIN_USER_ROLES} optionLabel="label" optionValue="value" className={classNames({ 'p-invalid': fieldState.invalid })} />
                  {fieldState.error && <small className="p-error">{fieldState.error.message}</small>}
                </>
              )} />
            </div>

            <div className="field col-12 md:col-6">
              <label htmlFor="ruc" className="font-semibold">
                RUC {selectedRole === 'ESTABLISHMENT_ADMIN' && <span className="text-red-500">*</span>}
              </label>
              <Controller name="ruc" control={control} render={({ field, fieldState }) => (
                <>
                  <InputText id={field.name} {...field} className={classNames({ 'p-invalid': fieldState.invalid })} />
                  <small className="text-500">
                    {selectedRole === 'ESTABLISHMENT_ADMIN' ? 'Obligatorio • 13 dígitos • RUC ecuatoriano válido' : 'Opcional'}
                  </small>
                  {fieldState.error && <small className="p-error block">{fieldState.error.message}</small>}
                </>
              )} />
            </div>

            <div className="field col-12 flex align-items-center mt-2 mb-4">
              <Controller name="active" control={control} render={({ field }) => (
                <>
                  <Checkbox inputId={field.name} checked={field.value} onChange={(e) => field.onChange(e.checked)} disabled={isEditingCurrentUser} />
                  <label htmlFor={field.name} className="ml-2 font-semibold">Usuario activo</label>
                </>
              )} />
              {isEditingCurrentUser && <small className="ml-3 text-500">Tu propio usuario siempre se conserva activo desde esta vista.</small>}
            </div>

            </div>

            <div className="flex justify-content-end mt-4 pt-3 border-top-1 surface-border">
              <Button
                type="submit"
                label="Guardar cambios"
                icon="pi pi-check"
                severity="warning"
                loading={updateMutation.isPending}
                className="w-full md:w-auto"
              />
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
