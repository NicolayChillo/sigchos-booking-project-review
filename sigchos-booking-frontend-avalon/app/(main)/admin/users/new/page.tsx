'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

import { useAuth } from '@/lib/auth/AuthContext';
import { getApiErrorMessage } from '@/lib/http/getApiErrorMessage';
import { createAdminUser } from '@/modules/users/api/adminUsersApi';
import { ADMIN_USER_ROLES } from '@/modules/users/types';

import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const createSchema = z.object({
  firstName: z.string().trim().min(1, 'Campo obligatorio.'),
  lastName: z.string().trim().min(1, 'Campo obligatorio.'),
  email: z.string().trim().email('Correo inválido.'),
  password: z.string().regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,100}$/,
    'Debe incluir mayúscula, minúscula y número (mín. 8 caracteres).'
  ),
  phone: z.string().trim().min(1, 'Campo obligatorio.'),
  ruc: z.string(),
  birthDate: z.string().trim().regex(dateRegex, 'Formato esperado: YYYY-MM-DD'),
  role: z.enum(['CLIENT', 'ESTABLISHMENT_ADMIN', 'SYSTEM_ADMIN']),
  active: z.boolean(),
}).superRefine((data, ctx) => {
  if (data.role !== 'ESTABLISHMENT_ADMIN') return;
  const r = data.ruc.trim();
  if (r.length < 10) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'El RUC es obligatorio para administrador de establecimiento (mínimo 10 caracteres).',
      path: ['ruc'],
    });
  }
});

type CreateFormValues = z.infer<typeof createSchema>;

export default function AdminUserCreatePage() {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useRef<Toast>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const canAccessAdminUsers = user?.role === 'SYSTEM_ADMIN';

  const { control, handleSubmit, watch, formState: { errors } } = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
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

  const createMutation = useMutation({
    mutationFn: createAdminUser,
    onSuccess: () => {
      toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Usuario creado correctamente.', life: 3000 });
      setTimeout(() => {
        router.push('/admin/users');
      }, 1500);
    },
    onError: (error) => {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error, 'No se pudo crear el usuario.'), life: 5000 });
    },
  });

  const onSubmit = (values: CreateFormValues) => {
    const rucTrim = values.ruc.trim();
    createMutation.mutate({
      ...values,
      ruc: rucTrim.length > 0 ? rucTrim : undefined,
    });
  };

  const selectedRole = watch('role');

  if (!mounted) return null;

  if (!canAccessAdminUsers) {
    return (
      <div className="card text-center p-5">
        <i className="pi pi-lock text-5xl text-red-500 mb-4"></i>
        <h2 className="text-900 m-0 mb-2">Acceso Denegado</h2>
        <p className="text-600 m-0">No tienes permisos para crear usuarios administrados.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-column gap-3">
      <Toast ref={toast} />

      <div className="card flex flex-column md:flex-row justify-content-between align-items-start gap-3">
        <div>
          <h2 className="m-0 text-900">Crear usuario</h2>
          <p className="mt-2 mb-0 text-600">Registra un nuevo usuario con rol y estado inicial.</p>
        </div>
        <Button label="Volver al listado" icon="pi pi-arrow-left" outlined onClick={() => router.push('/admin/users')} />
      </div>

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
            <label htmlFor="password" className="font-semibold">Contraseña</label>
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
                  {selectedRole === 'ESTABLISHMENT_ADMIN' ? 'Obligatorio (mín. 10 caracteres)' : 'Opcional'}
                </small>
                {fieldState.error && <small className="p-error block">{fieldState.error.message}</small>}
              </>
            )} />
          </div>

          <div className="field col-12 flex align-items-center mb-4">
            <Controller name="active" control={control} render={({ field }) => (
              <>
                <Checkbox inputId={field.name} checked={field.value} onChange={(e) => field.onChange(e.checked)} />
                <label htmlFor={field.name} className="ml-2 font-semibold">Crear como activo</label>
              </>
            )} />
          </div>

          </div>

          <div className="flex justify-content-end mt-4 pt-3 border-top-1 surface-border">
            <Button
              type="submit"
              label="Crear usuario"
              icon="pi pi-check"
              loading={createMutation.isPending}
              className="w-full md:w-auto"
            />
          </div>
        </form>
      </div>
    </div>
  );
}
