'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useAuth } from '@/lib/auth/AuthContext';
import { useEstablishmentRequestMutation } from '@/modules/establishmentRequests/hooks/useEstablishmentRequestMutation';

import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';

const validationSchema = z.object({
  name: z
    .string()
    .min(3, 'El nombre es muy corto')
    .max(100, 'El nombre es muy largo')
    .regex(/^[\p{L}0-9\s"]+$/u, 'El nombre contiene caracteres inválidos'),
  address: z
    .string()
    .min(3, 'La dirección es muy corta')
    .max(255, 'La dirección es muy larga')
    .regex(/^[\p{L}0-9\s"().,;:-]+$/u, 'La dirección contiene caracteres inválidos'),
  certificate: z
    .any()
    .refine((files) => files?.length === 1, 'Debes adjuntar un archivo.')
    .refine((files) => files?.[0]?.size > 0, 'Debes adjuntar el certificado en PDF.')
    .refine((files) => files?.[0]?.type === 'application/pdf', 'El archivo debe ser PDF.')
    .refine((files) => files?.[0]?.size <= 5 * 1024 * 1024, 'El PDF no puede superar 5 MB.'),
});

type FormValues = z.infer<typeof validationSchema>;

// ── Drag-and-drop file upload zone ─────────────────────────────────────────
interface FileUploadZoneProps {
  value: FileList | null;
  onChange: (files: FileList | null) => void;
  error?: string;
}

function FileUploadZone({ value, onChange, error }: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const selectedFile = value?.[0] ?? null;

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      const files = e.dataTransfer.files;
      if (files?.length) {
        onChange(files);
      }
    },
    [onChange],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.files);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="flex flex-column gap-2">
      <label className="font-semibold text-900">
        Certificado
        <span className="text-500 font-normal ml-2 text-sm">(PDF, máx. 5 MB)</span>
      </label>

      <div
        className={classNames(
          'border-2 border-dashed border-round-lg p-5 cursor-pointer transition-all transition-duration-200',
          {
            'surface-100 border-primary': dragging,
            'surface-0 border-300': !dragging && !error && !selectedFile,
            'surface-0 border-red-300': !!error && !selectedFile,
            'surface-50 border-green-300': !!selectedFile,
          },
        )}
        style={{ minHeight: selectedFile ? 'auto' : '160px' }}
        onClick={() => !selectedFile && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && !selectedFile && inputRef.current?.click()}
        aria-label="Zona para subir archivo PDF"
      >
        <input
          ref={inputRef}
          type="file"
          id="certificate"
          accept="application/pdf"
          className="hidden"
          onChange={handleChange}
          style={{ display: 'none' }}
        />

        {!selectedFile ? (
          <div className="flex flex-column align-items-center justify-content-center gap-3 text-center h-full">
            <div
              className={classNames(
                'flex align-items-center justify-content-center border-circle w-4rem h-4rem transition-all transition-duration-200',
                dragging ? 'bg-primary text-white' : 'surface-200 text-400',
              )}
            >
              <i className={classNames('text-2xl', dragging ? 'pi pi-upload' : 'pi pi-file-pdf')} />
            </div>
            <div>
              <p className={classNames('m-0 font-semibold', dragging ? 'text-primary' : 'text-700')}>
                {dragging ? 'Suelta el archivo aquí' : 'Arrastra tu PDF aquí'}
              </p>
              <p className="m-0 mt-1 text-500 text-sm">
                o{' '}
                <span className="text-primary font-medium cursor-pointer hover:underline">
                  selecciona desde tu dispositivo
                </span>
              </p>
            </div>
            <div className="flex align-items-center gap-3">
              <span className="text-300">|</span>
              <span className="text-400 text-xs">Formato aceptado: PDF</span>
              <span className="text-300">|</span>
              <span className="text-400 text-xs">Tamaño máximo: 5 MB</span>
            </div>
          </div>
        ) : (
          <div className="flex align-items-center gap-3">
            <div className="flex align-items-center justify-content-center border-circle w-3rem h-3rem bg-green-50 flex-shrink-0">
              <i className="pi pi-file-pdf text-xl text-green-600" />
            </div>
            <div className="flex flex-column gap-1 flex-1 overflow-hidden">
              <span className="font-semibold text-900 white-space-nowrap overflow-hidden text-overflow-ellipsis">
                {selectedFile.name}
              </span>
              <span className="text-500 text-sm">{formatBytes(selectedFile.size)}</span>
            </div>
            <div className="flex align-items-center gap-2 flex-shrink-0">
              <Button
                type="button"
                icon="pi pi-pencil"
                size="small"
                outlined
                severity="secondary"
                tooltip="Cambiar archivo"
                tooltipOptions={{ position: 'top' }}
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
              />
              <Button
                type="button"
                icon="pi pi-times"
                size="small"
                outlined
                severity="danger"
                tooltip="Quitar archivo"
                tooltipOptions={{ position: 'top' }}
                onClick={handleRemove}
              />
            </div>
          </div>
        )}
      </div>

      {error && !selectedFile && <small className="p-error">{error}</small>}
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function EstablishmentCreatePage() {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useRef<Toast>(null);

  const { create, mutationError, isMutationPending } = useEstablishmentRequestMutation();
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const canAccess = user?.role === 'ESTABLISHMENT_ADMIN';

  const form = useForm<FormValues>({
    defaultValues: {
      name: '',
      address: '',
    },
    resolver: zodResolver(validationSchema),
  });

  const { register, handleSubmit, reset, control, formState: { errors } } = form;

  const onSubmit = handleSubmit(async (values) => {
    setSubmitSuccess(false);
    try {
      await create({
        name: values.name.trim(),
        address: values.address.trim(),
        certificateFile: values.certificate[0] as File,
      });
      reset();
      setSubmitSuccess(true);
      toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Solicitud enviada correctamente', life: 3000 });
      setTimeout(() => {
        router.push('/establishments');
      }, 3000);
    } catch {
      /* error is exposed in mutationError */
    }
  });

  if (!mounted) return null;

  if (!canAccess) {
    return (
      <div className="card text-center p-5">
        <i className="pi pi-lock text-5xl text-red-500 mb-4" />
        <h2 className="text-900 m-0 mb-2">Acceso denegado</h2>
        <p className="text-600 m-0">No tienes permisos para crear una solicitud de establecimiento.</p>
      </div>
    );
  }

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <div className="flex flex-column gap-3">
      <Toast ref={toast} />

      {/* ── Header ── */}
      <div className="card flex flex-column md:flex-row justify-content-between align-items-start gap-3">
        <div>
          <h2 className="m-0 text-900">Nuevo establecimiento</h2>
          <p className="mt-2 mb-0 text-600">
            Envía una solicitud con el nombre comercial, la dirección y el certificado del SRI en PDF.
            Un administrador la revisará y, si se aprueba, el establecimiento aparecerá en tu listado.
          </p>
        </div>
        <Button
          label="Volver al listado"
          icon="pi pi-arrow-left"
          outlined
          severity="secondary"
          onClick={() => router.push('/establishments')}
          className="flex-shrink-0"
        />
      </div>

      {/* ── Body: form + sidebar ── */}
      <div className="grid">
        {/* Form card */}
        <div className="col-12 lg:col-8">
          <div className="card h-full">
            <div className="border-bottom-1 surface-border pb-3 mb-4">
              <h4 className="m-0 text-900">Datos de la solicitud</h4>
              <p className="m-0 mt-1 text-600">La información debe coincidir con la documentación adjunta.</p>
            </div>

            {/* Applicant banner */}
            <div className="flex align-items-center gap-3 surface-100 border-round p-3 mb-5">
              <div
                className="flex align-items-center justify-content-center border-circle bg-primary text-white font-bold flex-shrink-0"
                style={{ width: '2.5rem', height: '2.5rem', fontSize: '0.9rem' }}
              >
                {initials || <i className="pi pi-user" />}
              </div>
              <div className="flex flex-column gap-1">
                <span className="text-xs text-500 font-medium uppercase" style={{ letterSpacing: '0.05em' }}>Solicitante</span>
                <span className="font-semibold text-900">{user?.firstName} {user?.lastName}</span>
              </div>
            </div>

            <form onSubmit={onSubmit} className="flex flex-column gap-5">
              {/* Name + Address in a responsive grid */}
              <div className="p-fluid grid">
                <div className="field col-12 md:col-6">
                  <label htmlFor="name" className="font-semibold text-900">Nombre del establecimiento</label>
                  <span className="p-input-icon-left w-full">
                    <i className="pi pi-building" />
                    <InputText
                      id="name"
                      autoComplete="organization"
                      placeholder="Ej. Restaurante El Sigchos"
                      {...register('name')}
                      className={classNames('w-full', { 'p-invalid': errors.name })}
                    />
                  </span>
                  {errors.name && <small className="p-error">{errors.name.message}</small>}
                </div>

                <div className="field col-12 md:col-6">
                  <label htmlFor="address" className="font-semibold text-900">Dirección</label>
                  <span className="p-input-icon-left w-full">
                    <i className="pi pi-map-marker" />
                    <InputText
                      id="address"
                      autoComplete="street-address"
                      placeholder="Ej. Av. Principal 123, Sigchos"
                      {...register('address')}
                      className={classNames('w-full', { 'p-invalid': errors.address })}
                    />
                  </span>
                  {errors.address && <small className="p-error">{errors.address.message}</small>}
                </div>
              </div>

              {/* File upload zone */}
              <Controller
                name="certificate"
                control={control}
                render={({ field, fieldState }) => (
                  <FileUploadZone
                    value={(field.value as FileList) ?? null}
                    onChange={(files) => {
                      // Create a synthetic FileList-compatible object
                      if (!files || files.length === 0) {
                        field.onChange(undefined);
                      } else {
                        field.onChange(files);
                      }
                    }}
                    error={fieldState.error?.message}
                  />
                )}
              />

              {/* Status messages */}
              {submitSuccess && (
                <Message
                  severity="success"
                  text="Solicitud enviada. Un administrador la revisará y recibirás una respuesta por correo."
                  className="w-full justify-content-start"
                />
              )}
              {mutationError && (
                <Message severity="error" text={mutationError.message} className="w-full justify-content-start" />
              )}

              {/* Submit */}
              <div className="flex justify-content-end pt-3 border-top-1 surface-border">
                <Button
                  type="submit"
                  label="Enviar solicitud"
                  icon={isMutationPending ? 'pi pi-spinner pi-spin' : 'pi pi-send'}
                  loading={isMutationPending}
                  className="w-full md:w-auto"
                />
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar: process steps */}
        <div className="col-12 lg:col-4">
          <div className="card h-full">
            <div className="border-bottom-1 surface-border pb-3 mb-4">
              <h4 className="m-0 text-900">¿Cómo funciona?</h4>
              <p className="m-0 mt-1 text-600 text-sm">El proceso de aprobación en 3 pasos.</p>
            </div>

            <div className="flex flex-column gap-4">
              {[
                {
                  step: '1',
                  icon: 'pi-file-edit',
                  color: 'primary',
                  title: 'Completa la solicitud',
                  desc: 'Ingresa el nombre comercial, dirección y adjunta el certificado PDF del SRI.',
                },
                {
                  step: '2',
                  icon: 'pi-search',
                  color: 'orange',
                  title: 'Revisión administrativa',
                  desc: 'Un administrador verificará la información y el documento en un plazo de 1 a 3 días hábiles.',
                },
                {
                  step: '3',
                  icon: 'pi-check-circle',
                  color: 'green',
                  title: 'Activación del establecimiento',
                  desc: 'Si se aprueba, el establecimiento aparecerá en tu listado para configurar horarios y políticas.',
                },
              ].map(({ step, icon, color, title, desc }) => (
                <div key={step} className="flex gap-3">
                  <div className="flex flex-column align-items-center gap-2">
                    <div
                      className={classNames(
                        'flex align-items-center justify-content-center border-circle font-bold text-sm flex-shrink-0',
                        `bg-${color}-50 text-${color}-700`,
                      )}
                      style={{ width: '2.25rem', height: '2.25rem' }}
                    >
                      <i className={`pi ${icon}`} />
                    </div>
                    {step !== '3' && <div className="border-left-1 surface-border flex-1" style={{ minHeight: '1.5rem' }} />}
                  </div>
                  <div className="flex flex-column gap-1 pb-1">
                    <span className="font-semibold text-900 text-sm">{title}</span>
                    <span className="text-500 text-sm line-height-3">{desc}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 surface-100 border-round flex gap-2 align-items-start">
              <i className="pi pi-info-circle text-primary mt-1 flex-shrink-0" />
              <span className="text-600 text-sm line-height-3">
                Asegúrate de que el PDF sea legible y no supere los 5 MB para evitar rechazos.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
