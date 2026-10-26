'use client';

import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { useAuth } from '@/lib/auth/AuthContext';
import { getApiErrorMessage } from '@/lib/http/getApiErrorMessage';
import { changePassword, getProfile, updateProfile } from '@/modules/profile/api/profileApi';

import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Toast } from 'primereact/toast';

const profileSchema = z.object({
  firstName: z.string().trim().min(1, 'Ingresa tu nombre.').regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'El nombre solo puede contener letras.'),
  lastName: z.string().trim().min(1, 'Ingresa tu apellido.').regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'El apellido solo puede contener letras.'),
  email: z.string().email('Ingresa un correo valido.'),
  phone: z.string().trim().min(7, 'Ingresa un telefono valido.').regex(/^\d+$/, 'El teléfono solo puede contener números.'),
  birthDate: z.string().min(1, 'Selecciona una fecha de nacimiento.')
    .refine((val) => {
      const date = new Date(val)
      return !isNaN(date.getTime())
    }, 'Ingresa una fecha válida.')
    .refine((val) => {
      const date = new Date(val)
      return date <= new Date()
    }, 'La fecha de nacimiento no puede ser futura.')
    .refine((val) => {
      const date = new Date(val)
      const minDate = new Date()
      minDate.setFullYear(minDate.getFullYear() - 120)
      return date >= minDate
    }, 'Ingresa una fecha de nacimiento coherente.'),
});

const passwordSchemaWithCurrent = z
  .object({
    currentPassword: z.string().min(1, 'Ingresa tu contraseña actual.'),
    newPassword: z
      .string()
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,100}$/,
        'Debe incluir mayúscula, minúscula y número (mín. 8 caracteres).'
      ),
    confirmPassword: z.string().min(8, 'Confirma la nueva contraseña.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Las contraseñas no coinciden.',
  });

const passwordSchemaWithoutCurrent = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: z
      .string()
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,100}$/,
        'Debe incluir mayúscula, minúscula y número (mín. 8 caracteres).'
      ),
    confirmPassword: z.string().min(8, 'Confirma la nueva contraseña.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Las contraseñas no coinciden.',
  });

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchemaWithCurrent>;

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user, updateUser, signOut } = useAuth();
  const toast = React.useRef<Toast>(null);
  const [mounted, setMounted] = useState(false);

  const userHasPassword = user?.hasPassword ?? true;

  // Booking redirect params — present when the user arrived here after a Google login
  // from a room detail page that required a complete profile to book
  const redirectTo = searchParams.get('redirectTo') ?? '';
  const redirectCheckIn = searchParams.get('checkInDate') ?? '';
  const redirectCheckOut = searchParams.get('checkOutDate') ?? '';
  const safeRedirectTo = redirectTo.startsWith('/landing/') ? redirectTo : '';

  function buildBookingRedirectUrl() {
    if (!safeRedirectTo) return '';
    const params = new URLSearchParams();
    if (redirectCheckIn) params.set('checkInDate', redirectCheckIn);
    if (redirectCheckOut) params.set('checkOutDate', redirectCheckOut);
    const qs = params.toString();
    return qs ? `${safeRedirectTo}?${qs}` : safeRedirectTo;
  }

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      birthDate: '',
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(userHasPassword ? passwordSchemaWithCurrent : passwordSchemaWithoutCurrent) as any,
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  });

  function forceRelogin(message: string) {
    window.alert(message);
    signOut();
    router.replace('/auth/login');
  }

  useEffect(() => {
    setMounted(true);
    const currentProfile = profileQuery.data ?? user;

    if (!currentProfile) {
      return;
    }

    profileForm.reset({
      firstName: currentProfile.firstName,
      lastName: currentProfile.lastName,
      email: currentProfile.email,
      phone: currentProfile.phone,
      birthDate: currentProfile.birthDate,
    });
  }, [profileForm, profileQuery.data, user]);

  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updatedUser) => {
      const previousEmail = (user?.email ?? '').trim().toLowerCase();
      const nextEmail = updatedUser.email.trim().toLowerCase();
      const emailChanged = previousEmail.length > 0 && previousEmail !== nextEmail;

      if (emailChanged) {
        forceRelogin('Tu correo fue actualizado. Por seguridad debes volver a iniciar sesion.');
        return;
      }

      // If the user just completed an incomplete profile (e.g. Google sign-in)
      // and there's a pending room redirect, send them back to book
      const wasIncomplete = !user?.profileCompleted;
      const isNowComplete = updatedUser.profileCompleted;
      if (wasIncomplete && isNowComplete && safeRedirectTo) {
        updateUser(updatedUser);
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        router.replace(buildBookingRedirectUrl());
        return;
      }

      updateUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Perfil actualizado correctamente.', life: 3000 });
    },
    onError: (error) => {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error, 'No se pudo actualizar el perfil.'), life: 5000 });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      forceRelogin('Tu contraseña fue actualizada. Por seguridad debes volver a iniciar sesion.');
    },
    onError: (error) => {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error, 'No se pudo actualizar la Contraseña.'), life: 5000 });
    },
  });

  const onSubmitProfile = profileForm.handleSubmit((formValues) => {
    updateProfileMutation.mutate(formValues);
  });

  const onSubmitPassword = passwordForm.handleSubmit((formValues) => {
    changePasswordMutation.mutate({
      ...(userHasPassword ? { currentPassword: formValues.currentPassword } : {}),
      newPassword: formValues.newPassword,
    });
  });

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex flex-column gap-3">
      <Toast ref={toast} />
      {!user?.profileCompleted && (
        <Message
          severity="warn"
          text="Te registraste con tu cuenta de Google. Para poder realizar reservas y recibir notificaciones, por favor ingresa tu número de teléfono y verifica tu fecha de nacimiento."
          content={(
            <div className="flex align-items-center">
              <i className="pi pi-exclamation-triangle mr-2 text-xl" />
              <div>
                <strong>⚠️ ¡Completa tu perfil para continuar!</strong>
                <p className="m-0 mt-1">Te registraste con tu cuenta de Google. Para poder realizar reservas y recibir notificaciones, por favor ingresa tu número de teléfono y verifica tu fecha de nacimiento.</p>
              </div>
            </div>
          )}
        />
      )}

      <div className="card">
        <h2>Mi Perfil</h2>
        <p className="text-color-secondary m-0">Mantén tus datos y tu acceso al día; la información de contacto se usa en reservas y notificaciones.</p>
      </div>

      <div className="card">
        <div className="grid grid-nogutter">
          {/* Información personal - Izquierda */}
          <div className="col-12 lg:col-6 lg:pr-6">
            <h5 className="mb-4 border-bottom-1 surface-border pb-3">Información personal</h5>

            {profileQuery.isLoading && <p className="text-color-secondary">Cargando perfil...</p>}

            {profileQuery.isError && (
              <Message severity="error" text={getApiErrorMessage(profileQuery.error, 'No se pudo cargar la informacion del perfil.')} className="w-full mb-4" />
            )}

            <form onSubmit={onSubmitProfile} className="p-fluid formgrid grid">
              <div className="field col-12 md:col-6">
                <label htmlFor="firstName" className="font-bold">Nombre</label>
                <InputText
                  id="firstName"
                  {...profileForm.register('firstName')}
                  className={profileForm.formState.errors.firstName ? 'p-invalid' : ''}
                />
                {profileForm.formState.errors.firstName && <small className="p-error">{profileForm.formState.errors.firstName.message}</small>}
              </div>

              <div className="field col-12 md:col-6">
                <label htmlFor="lastName" className="font-bold">Apellido</label>
                <InputText
                  id="lastName"
                  {...profileForm.register('lastName')}
                  className={profileForm.formState.errors.lastName ? 'p-invalid' : ''}
                />
                {profileForm.formState.errors.lastName && <small className="p-error">{profileForm.formState.errors.lastName.message}</small>}
              </div>

              <div className="field col-12">
                <label htmlFor="email" className="font-bold">Correo</label>
                <InputText
                  id="email"
                  type="email"
                  {...profileForm.register('email')}
                  className={profileForm.formState.errors.email ? 'p-invalid' : ''}
                />
                {profileForm.formState.errors.email && <small className="p-error">{profileForm.formState.errors.email.message}</small>}
              </div>

              <div className="field col-12 md:col-6">
                <label htmlFor="phone" className="font-bold">Teléfono</label>
                <InputText
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  {...profileForm.register('phone', {
                    onChange: (e) => {
                      e.target.value = e.target.value.replace(/\D/g, '')
                    },
                  })}
                  className={profileForm.formState.errors.phone ? 'p-invalid' : ''}
                />
                {profileForm.formState.errors.phone && <small className="p-error">{profileForm.formState.errors.phone.message}</small>}
              </div>

              <div className="field col-12 md:col-6">
                <label htmlFor="birthDate" className="font-bold">Fecha de nacimiento</label>
                <InputText
                  id="birthDate"
                  type="date"
                  {...profileForm.register('birthDate')}
                  className={profileForm.formState.errors.birthDate ? 'p-invalid' : ''}
                />
                {profileForm.formState.errors.birthDate && <small className="p-error">{profileForm.formState.errors.birthDate.message}</small>}
              </div>

              <div className="col-12 mt-3">
                <Button
                  type="submit"
                  label={updateProfileMutation.isPending ? 'Guardando...' : 'Guardar perfil'}
                  icon="pi pi-check"
                  disabled={updateProfileMutation.isPending}
                  className="w-full"
                />
              </div>
            </form>
          </div>

          {/* Seguridad - Derecha */}
          <div className="col-12 lg:col-6 lg:pl-6 lg:border-left-1 surface-border mt-6 lg:mt-0 pt-5 lg:pt-0 border-top-1 lg:border-top-none">
            <h5 className="mb-4 border-bottom-1 surface-border pb-3">Seguridad</h5>
            <form onSubmit={onSubmitPassword} className="p-fluid flex flex-column gap-3">
              {!userHasPassword && (
                <Message
                  severity="info"
                  text="Como te registraste con Google, puedes establecer una contraseña directamente sin necesidad de ingresar una contraseña anterior."
                  className="w-full mb-2"
                />
              )}
              {userHasPassword && (
              <div className="field mb-0">
                <label htmlFor="currentPassword" className="font-bold">Contraseña actual</label>
                <Controller
                  name="currentPassword"
                  control={passwordForm.control}
                  render={({ field, fieldState }) => (
                    <>
                      <Password
                        id={field.name}
                        {...field}
                        toggleMask
                        feedback={false}
                        className={fieldState.error ? 'p-invalid' : ''}
                      />
                      {fieldState.error && <small className="p-error">{fieldState.error.message}</small>}
                    </>
                  )}
                />
              </div>
              )}

              <div className="field mb-0">
                <label htmlFor="newPassword" className="font-bold">Nueva contraseña</label>
                <Controller
                  name="newPassword"
                  control={passwordForm.control}
                  render={({ field, fieldState }) => (
                    <>
                      <Password
                        id={field.name}
                        {...field}
                        toggleMask
                        className={fieldState.error ? 'p-invalid' : ''}
                        promptLabel="Ingresa una contraseña"
                        weakLabel="Débil"
                        mediumLabel="Media"
                        strongLabel="Fuerte"
                      />
                      {fieldState.error && <small className="p-error">{fieldState.error.message}</small>}
                    </>
                  )}
                />
              </div>

              <div className="field mb-0">
                <label htmlFor="confirmPassword" className="font-bold">Confirmar nueva contraseña</label>
                <Controller
                  name="confirmPassword"
                  control={passwordForm.control}
                  render={({ field, fieldState }) => (
                    <>
                      <Password
                        id={field.name}
                        {...field}
                        toggleMask
                        feedback={false}
                        className={fieldState.error ? 'p-invalid' : ''}
                      />
                      {fieldState.error && <small className="p-error">{fieldState.error.message}</small>}
                    </>
                  )}
                />
              </div>

              <div className="mt-3">
                <Button
                  type="submit"
                  label={changePasswordMutation.isPending ? 'Actualizando...' : (userHasPassword ? 'Cambiar contraseña' : 'Establecer contraseña')}
                  icon="pi pi-lock"
                  disabled={changePasswordMutation.isPending}
                  className="w-full"
                />
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
