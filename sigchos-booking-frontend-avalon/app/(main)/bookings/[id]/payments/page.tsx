'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import z from 'zod';

import { useAuth } from '@/lib/auth/AuthContext';
import { getApiErrorMessage } from '@/lib/http/getApiErrorMessage';
import { getBookingById } from '@/modules/bookings/api/bookingsApi';
import { usePaymentsByBookingIdList } from '@/modules/payments/hooks/usePaymentsByBookingIdList';
import { usePaymentMutation } from '@/modules/payments/hooks/usePaymentMutation';
import {
  PaymentStatus,
  PaymentStatusLabel
} from '@/modules/payments/enums/PaymentStatus';
import {
  PaymentMethod,
  PaymentMethodLabel
} from '@/modules/payments/enums/PaymentMethod';
import { PaymentStatusFilter } from '@/modules/payments/enums/PaymentStatusFilter';
import type { Payment } from '@/modules/payments/models/payment';
import type { UserRole } from '@/lib/auth/types';

import { Button } from 'primereact/button';
import { Tag, TagProps } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { FileUpload } from 'primereact/fileupload';
import { Dialog } from 'primereact/dialog';
import { useModal } from '@/lib/hooks/useModal';
import { PaymentCheckoutResponse } from '@/modules/payments/dto/payment';
import PayPhoneModal from '@/modules/payments/components/PayphoneModal';

function formatMoney(value: number): string {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

const uploadBankTransferSchema = z.object({
  receiptFile: z
    .any()
    .refine((file) => file != null, 'Este campo es obligatorio')
});

function PaymentPanel({
  bookingId,
  title,
  description,
  details,
  payments,
  role,
  disabled,
  disabledMessage,
  historyTitle,
  allowUpload = true,
  showHistoryHeader = true,
  emptyMessage,
  headerMeta,
  paymentItemTitle,
  getPaymentItemTitle,
  showTitleStatus = false,
  isGatewayPaymentAllowed = false,
  toast,
  onPayphonePayment,
  icon,
  bankInfo
}: {
  bookingId?: number;
  title?: string;
  description?: string;
  details?: Array<{ label: string; value: string }>;
  payments?: Payment[];
  role?: UserRole;
  disabled?: boolean;
  disabledMessage?: string;
  historyTitle?: string;
  allowUpload?: boolean;
  showHistoryHeader?: boolean;
  emptyMessage?: string;
  headerMeta?: string;
  paymentItemTitle?: string;
  getPaymentItemTitle?: (payment: Payment, index: number) => string;
  showTitleStatus?: boolean;
  isGatewayPaymentAllowed?: boolean;
  toast: React.RefObject<Toast>;
  onPayphonePayment?: (bookingId: number) => Promise<void> | void;
  icon?: string;
  bankInfo?: {
    bankName: string | null;
    bankAccountType: string | null;
    bankAccountNumber: string | null;
    bankAccountOwnerName: string | null;
    bankAccountOwnerId: string | null;
  } | null;
}) {
  const [rejectingPaymentId, setRejectingPaymentId] = useState<number | null>(
    null
  );
  const [rejectionReason, setRejectionReason] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    uploadBankTransferReceipt,
    validateBankTransferReceipt,
    isMutationPending
  } = usePaymentMutation();

  const hasBankInfo = !!(bankInfo?.bankName || bankInfo?.bankAccountNumber);

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(uploadBankTransferSchema),
    defaultValues: { receiptFile: null as any }
  });

  const isDisabled =
    disabled || isSubmitting || isMutationPending || !bookingId;
  const hasPayments = (payments?.length ?? 0) > 0;
  const hasDetails = (details?.length ?? 0) > 0;

  const getPaymentTitle = (payment: Payment, index: number) =>
    getPaymentItemTitle
      ? getPaymentItemTitle(payment, index)
      : paymentItemTitle ?? `Pago ${index + 1}`;
  const titleStatus = showTitleStatus
    ? payments?.[payments.length - 1]?.status
    : undefined;

  const getStatusSeverity = (status: PaymentStatus): TagProps['severity'] => {
    switch (status) {
      case PaymentStatus.CREATED:
        return 'info';

      case PaymentStatus.PENDING:
        return 'warning';

      case PaymentStatus.APPROVED:
        return 'success';

      case PaymentStatus.REJECTED:
        return 'danger';

      case PaymentStatus.CANCELLED:
        return 'danger';

      default:
        return 'info';
    }
  };

  const activeGatewayPayment = payments?.find(
    (payment) =>
      payment.method === PaymentMethod.GATEWAY &&
      payment.status === PaymentStatus.CREATED
  );

  const handlePayphonePayment = () => {
    if (!bookingId) return;

    onPayphonePayment?.(bookingId);
  };

  const onSubmit = async (data: z.infer<typeof uploadBankTransferSchema>) => {
    if (!bookingId) return;
    try {
      await uploadBankTransferReceipt({ bookingId, file: data.receiptFile });
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Comprobante enviado correctamente.',
        life: 3000
      });
      reset();
    } catch (error: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: getApiErrorMessage(error, 'No se pudo subir el comprobante.'),
        life: 5000
      });
    }
  };

  const handleAccept = async (paymentId: number) => {
    try {
      await validateBankTransferReceipt({
        id: paymentId,
        dto: { status: PaymentStatus.APPROVED, rejectionReason: null }
      });
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Pago aprobado correctamente.',
        life: 3000
      });
    } catch (error: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: getApiErrorMessage(error, 'No se pudo aprobar el pago.'),
        life: 5000
      });
    }
  };

  const handleReject = async () => {
    if (!rejectingPaymentId) return;
    const reason = rejectionReason.trim();
    if (reason.length < 10) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Atención',
        detail: 'El motivo es muy corto (mínimo 10 caracteres).',
        life: 4000
      });
      return;
    }
    if (reason.length > 100) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Atención',
        detail: 'El motivo es muy largo (máximo 100 caracteres).',
        life: 4000
      });
      return;
    }

    try {
      await validateBankTransferReceipt({
        id: rejectingPaymentId,
        dto: { rejectionReason: reason, status: PaymentStatus.REJECTED }
      });
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Pago rechazado correctamente.',
        life: 3000
      });
      setRejectingPaymentId(null);
      setRejectionReason('');
    } catch (error: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: getApiErrorMessage(error, 'No se pudo rechazar el pago.'),
        life: 5000
      });
    }
  };

  return (
    <div className="card">
      {/* HEADER */}
      {(title || description || headerMeta) && (
        <div className="flex flex-column md:flex-row justify-content-between align-items-start gap-3 mb-4 pb-3 border-bottom-1 surface-border">
          <div>
            {title && (
              <div className="flex align-items-center gap-2 mb-1">
                {icon && <i className={`${icon} text-primary text-2xl`}></i>}
                <h3 className="m-0 text-xl font-semibold text-900">{title}</h3>
                {titleStatus && (
                  <Tag
                    severity={getStatusSeverity(titleStatus)}
                    value={PaymentStatusLabel[titleStatus]}
                    className="ml-2"
                  />
                )}
              </div>
            )}
            {description && <p className="m-0 mt-1 text-600">{description}</p>}
          </div>

          {headerMeta && (
            <span className="text-600">
              {headerMeta}
            </span>
          )}
        </div>
      )}

      {/* DETAILS */}
      {hasDetails && (
        <div className="flex flex-wrap gap-3 mb-4">
          {details?.map((d, index) => (
            <div key={d.label} className="flex-1 min-w-min">
              <div
                className={`p-3 border-round h-full ${
                  index === details.length - 1
                    ? 'bg-primary-50 border-1 border-primary-200'
                    : 'surface-50 border-1 surface-border'
                }`}
              >
                <div
                  className={`text-sm mb-1 ${
                    index === details.length - 1
                      ? 'text-primary-700'
                      : 'text-500'
                  }`}
                >
                  {d.label}
                </div>
                <div
                  className={`text-xl font-bold ${
                    index === details.length - 1
                      ? 'text-primary-900'
                      : 'text-900'
                  }`}
                >
                  {d.value}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ACTION AREA (MUY IMPORTANTE) */}
      {allowUpload && (
        <div className="surface-50 border-round border-1 surface-border p-4 mb-4">
          <h4 className="m-0 mb-3 text-900 font-semibold border-bottom-1 surface-border pb-3">
            <i className="pi pi-credit-card mr-2 text-primary"></i>Opciones de Pago
          </h4>

          {disabledMessage && (
            <Message
              severity="info"
              text={disabledMessage}
              className="mb-4 w-full"
            />
          )}

          {!disabled && (
            <div className="grid">
              {/* Opción 1: Tarjeta */}
              {isGatewayPaymentAllowed && (
                <div className="col-12 md:col-6 p-2">
                  <div className="h-full border-1 surface-border border-round p-4 flex flex-column align-items-center justify-content-center gap-3 hover:border-primary transition-colors transition-duration-200">
                    <div className="surface-100 border-circle w-4rem h-4rem flex align-items-center justify-content-center">
                      <i className="pi pi-credit-card text-2xl text-primary"></i>
                    </div>
                    <div className="text-center">
                      <h5 className="m-0 mb-1 text-900">
                        Tarjeta de Crédito / Débito
                      </h5>
                      <p className="m-0 text-500 text-sm">
                        Pago inmediato y seguro mediante PayPhone
                      </p>
                    </div>
                    <Button
                      className="w-full mt-2"
                      label={
                        activeGatewayPayment
                          ? 'Continuar pago'
                          : 'Pagar con Tarjeta'
                      }
                      icon="pi pi-bolt"
                      severity="info"
                      onClick={handlePayphonePayment}
                      loading={isSubmitting || isMutationPending}
                      disabled={!isGatewayPaymentAllowed}
                    />
                  </div>
                </div>
              )}

              {/* Opción 2: Transferencia */}
              <div className={`col-12 ${isGatewayPaymentAllowed ? 'md:col-6' : ''} p-2`}>
                <div className="h-full border-1 surface-border border-round p-4 flex flex-column gap-3 hover:border-primary transition-colors transition-duration-200">
                  <div className="flex flex-column align-items-center text-center gap-2 mb-2">
                    <div className="surface-100 border-circle w-4rem h-4rem flex align-items-center justify-content-center">
                      <i className="pi pi-building-columns text-2xl text-primary"></i>
                    </div>
                    <div>
                      <h5 className="m-0 mb-1 text-900">
                        Transferencia Bancaria
                      </h5>
                      <p className="m-0 text-500 text-sm">
                        Sube tu comprobante (PDF o Imagen)
                      </p>
                    </div>
                  </div>

                  {/* Datos bancarios del establecimiento */}
                  {hasBankInfo && (
                    <div className="surface-50 border-1 surface-border border-round p-3 flex flex-column gap-2">
                      <div className="flex align-items-center gap-2 mb-1">
                        <i className="pi pi-info-circle text-primary text-sm"></i>
                        <span className="font-semibold text-sm text-900">Datos para la transferencia</span>
                      </div>
                      {bankInfo?.bankName && (
                        <div className="flex justify-content-between text-sm">
                          <span className="text-600">Banco</span>
                          <span className="font-medium text-900">{bankInfo.bankName}</span>
                        </div>
                      )}
                      {bankInfo?.bankAccountType && (
                        <div className="flex justify-content-between text-sm">
                          <span className="text-600">Tipo de cuenta</span>
                          <span className="font-medium text-900">{bankInfo.bankAccountType}</span>
                        </div>
                      )}
                      {bankInfo?.bankAccountNumber && (
                        <div className="flex justify-content-between text-sm">
                          <span className="text-600">Número de cuenta</span>
                          <span className="font-medium text-900 font-mono">{bankInfo.bankAccountNumber}</span>
                        </div>
                      )}
                      {bankInfo?.bankAccountOwnerName && (
                        <div className="flex justify-content-between text-sm">
                          <span className="text-600">Titular</span>
                          <span className="font-medium text-900">{bankInfo.bankAccountOwnerName}</span>
                        </div>
                      )}
                      {bankInfo?.bankAccountOwnerId && (
                        <div className="flex justify-content-between text-sm">
                          <span className="text-600">Cédula / RUC</span>
                          <span className="font-medium text-900">{bankInfo.bankAccountOwnerId}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="flex flex-column gap-3 mt-auto"
                  >
                    <Controller
                      name="receiptFile"
                      control={control}
                      render={({ field }) => (
                        <div className="flex flex-column gap-2">
                          <label htmlFor="receipt-file" className="font-semibold text-900">
                            Comprobante
                            <span className="text-500 font-normal ml-2 text-sm">(JPG, PNG o WebP, máx. 5 MB)</span>
                          </label>

                          <div 
                            role="button"
                            tabIndex={0}
                            className={`border-2 border-dashed border-round-lg p-4 transition-all transition-duration-200 flex flex-column align-items-center justify-content-center overflow-hidden cursor-pointer ${
                              field.value ? 'surface-50 border-green-300' : 'surface-0 border-300 hover:surface-100 hover:border-primary'
                            } ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}
                            style={{ minHeight: field.value ? 'auto' : '160px' }}
                            onClick={() => !field.value && !isDisabled && fileInputRef.current?.click()}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                !field.value && !isDisabled && fileInputRef.current?.click();
                              }
                            }}
                          >
                            <input
                              id="receipt-file"
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={(e) => field.onChange(e.target.files?.[0] || null)}
                              disabled={isDisabled}
                              className="hidden"
                              style={{ display: 'none' }}
                            />
                            
                            {field.value ? (
                              <div className="flex align-items-center w-full gap-3">
                                <div className="flex align-items-center justify-content-center border-circle w-3rem h-3rem bg-green-50 flex-shrink-0">
                                  <i className="pi pi-image text-xl text-green-600" />
                                </div>
                                <div className="flex flex-column gap-1 flex-1 overflow-hidden text-left">
                                  <span className="font-semibold text-900 white-space-nowrap overflow-hidden text-overflow-ellipsis">
                                    {field.value.name}
                                  </span>
                                  <span className="text-500 text-sm">
                                    {(field.value.size / 1024 / 1024).toFixed(2)} MB
                                  </span>
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
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      fileInputRef.current?.click();
                                    }}
                                  />
                                  <Button
                                    type="button"
                                    icon="pi pi-times"
                                    size="small"
                                    outlined
                                    severity="danger"
                                    tooltip="Eliminar"
                                    tooltipOptions={{ position: 'top' }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      field.onChange(null);
                                      if (fileInputRef.current) fileInputRef.current.value = '';
                                    }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-column align-items-center justify-content-center gap-3 text-center h-full w-full pointer-events-none">
                                <div className="flex align-items-center justify-content-center border-circle w-4rem h-4rem transition-all transition-duration-200 surface-200 text-400">
                                  <i className="text-2xl pi pi-image" />
                                </div>
                                <div>
                                  <p className="m-0 font-semibold text-700">
                                    Arrastra tu imagen aquí
                                  </p>
                                  <p className="m-0 mt-1 text-500 text-sm">
                                    o <span className="text-primary font-medium cursor-pointer hover:underline">selecciona desde tu dispositivo</span>
                                  </p>
                                </div>
                                <div className="flex align-items-center gap-3">
                                  <span className="text-300">|</span>
                                  <span className="text-400 text-xs">JPG, PNG o WebP</span>
                                  <span className="text-300">|</span>
                                  <span className="text-400 text-xs">Máx: 5 MB</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    />

                    {errors.receiptFile && (
                      <small className="p-error text-center block">
                        {errors.receiptFile.message?.toString()}
                      </small>
                    )}

                    <Button
                      type="submit"
                      label="Enviar comprobante"
                      icon="pi pi-upload"
                      className="w-full"
                      disabled={isDisabled}
                      loading={isSubmitting || isMutationPending}
                    />
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* HISTORY */}
      {showHistoryHeader && (
        <div className="flex justify-content-between align-items-center mb-3 border-bottom-1 surface-border pb-3">
          <h4 className="m-0 text-900">
            {historyTitle ?? 'Historial de pagos'}
          </h4>
          <span className="text-600">
            {payments?.length ?? 0} pagos
          </span>
        </div>
      )}

      {hasPayments ? (
        <div className="flex flex-column gap-3">
          {payments?.map((p, i) => (
            <div
              key={p.id}
              className="p-3 border-1 surface-border border-round flex flex-column md:flex-row align-items-start md:align-items-center justify-content-between gap-3"
            >
              <div className="flex align-items-center gap-3 w-full md:w-auto">
                <div className="surface-100 border-circle w-3rem h-3rem flex align-items-center justify-content-center flex-shrink-0">
                  <i
                    className={`pi ${
                      p.method === PaymentMethod.GATEWAY
                        ? 'pi-credit-card text-blue-500'
                        : 'pi-building-columns text-green-500'
                    } text-xl`}
                  ></i>
                </div>

                <div className="w-full">
                  <div className="flex align-items-center gap-2 mb-1">
                    <span className="font-semibold text-900">
                      {getPaymentTitle(p, i)}
                    </span>
                    <Tag
                      severity={getStatusSeverity(p.status)}
                      value={PaymentStatusLabel[p.status]}
                      className="text-xs"
                    />
                  </div>

                  <div className="text-sm text-500">
                    <span className="font-medium">
                      {PaymentMethodLabel[p.method]}
                    </span>{' '}
                    • {new Date(p.createdAt).toLocaleString()}
                  </div>

                  {p.transactionReference && (
                    <div className="text-xs text-600 mt-1 flex align-items-center gap-1">
                      <i className="pi pi-hashtag text-xs"></i> Ref:{' '}
                      <span className="font-mono">
                        {p.transactionReference}
                      </span>
                    </div>
                  )}

                  {p.receiptUrl && (
                    <div className="mt-2">
                      <a
                        href={p.receiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary text-sm font-medium hover:underline flex align-items-center gap-1"
                        style={{ textDecoration: 'none' }}
                      >
                        <i className="pi pi-external-link text-xs"></i> Ver comprobante adjunto
                      </a>
                    </div>
                  )}

                  {p.rejectionReason && (
                    <div className="text-sm text-red-500 mt-2 bg-red-50 p-2 border-round border-1 border-red-200">
                      <i className="pi pi-info-circle mr-1"></i>{' '}
                      {p.rejectionReason}
                    </div>
                  )}
                </div>
              </div>

              {role === 'ESTABLISHMENT_ADMIN' &&
                p.status === PaymentStatus.PENDING &&
                p.method === PaymentMethod.BANK_TRANSFER && (
                  <div className="flex flex-row md:flex-column gap-2 w-full md:w-auto mt-2 md:mt-0">
                    <Button
                      label="Aprobar"
                      icon="pi pi-check"
                      size="small"
                      severity="success"
                      outlined
                      className="flex-1 md:flex-none"
                      onClick={() => handleAccept(p.id)}
                    />
                    <Button
                      label="Rechazar"
                      icon="pi pi-times"
                      size="small"
                      severity="danger"
                      outlined
                      className="flex-1 md:flex-none"
                      onClick={() => setRejectingPaymentId(p.id)}
                    />
                  </div>
                )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-5 border-dashed border-1 surface-border border-round">
          <i className="pi pi-inbox text-4xl text-300 mb-2"></i>
          <p className="text-600 m-0">
            {emptyMessage ?? 'No hay pagos registrados'}
          </p>
        </div>
      )}

      {/* DIALOG */}
      <Dialog
        header="Rechazar pago"
        visible={!!rejectingPaymentId}
        style={{ width: '90vw', maxWidth: '420px' }}
        onHide={() => setRejectingPaymentId(null)}
      >
        <div className="flex flex-column gap-3">
          <InputText
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Motivo del rechazo"
          />

          <div className="flex justify-content-end gap-2">
            <Button
              label="Cancelar"
              text
              onClick={() => setRejectingPaymentId(null)}
            />
            <Button
              label="Confirmar"
              severity="danger"
              onClick={handleReject}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}

export default function PaymentsPage() {
  const params = useParams();
  const bookingId = Number(params.id);
  const router = useRouter();
  const { user } = useAuth();
  const toast = useRef<Toast>(null);
  const [mounted, setMounted] = useState(false);
  const {
    isOpen: isPayphoneModalOpen,
    open: openPayphoneModal,
    close: closePayphoneModal
  } = useModal();
  const [paymentDetails, setPaymentDetails] =
    useState<PaymentCheckoutResponse | null>(null);
  const { createPaymentCheckout, isMutationPending } = usePaymentMutation();

  useEffect(() => {
    setMounted(true);
  }, []);

  const bookingQuery = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => getBookingById(bookingId),
    enabled: Number.isFinite(bookingId) && mounted
  });

  const { data: paymentsOverview, isPending: isPaymentsOverviewPending } =
    usePaymentsByBookingIdList({
      bookingId: bookingId,
      status: PaymentStatusFilter.ALL
    });

  const booking = bookingQuery.data;
  const requiresAdvancePayment = (booking?.advancePaymentPercentage ?? 0) > 0;
  const totalAmount = booking?.totalAmount ?? 0;
  const advancePaymentAmount = booking?.advancePaymentAmount ?? 0;
  const remainingAmount = Math.max(0, totalAmount - advancePaymentAmount);
  const isAdvanceConfirmed = booking?.status === 'ADVANCE_CONFIRMED';
  const isBookingCompleted = booking?.status === 'COMPLETED';

  const handlePayphonePayment = async () => {
    if (!bookingId) return;

    try {
      const data = await createPaymentCheckout({ bookingId });

      setPaymentDetails(data);

      openPayphoneModal();
    } catch (error: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo conectar con PayPhone. Inténtalo de nuevo.',
        life: 5000
      });
    }
  };

  const sortedPayments = useMemo(() => {
    return [...(paymentsOverview ?? [])].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [paymentsOverview]);

  const advanceConfirmedPayment = sortedPayments.find(
    (p: Payment) => p.status === PaymentStatus.APPROVED
  );

  const advancePayments = useMemo(() => {
    if (!requiresAdvancePayment) return [];
    if (!advanceConfirmedPayment) return sortedPayments;
    return sortedPayments.filter(
      (p: Payment) =>
        new Date(p.createdAt).getTime() <=
        new Date(advanceConfirmedPayment.createdAt).getTime()
    );
  }, [advanceConfirmedPayment, requiresAdvancePayment, sortedPayments]);

  const remainingPayments = useMemo(() => {
    if (!requiresAdvancePayment || !advanceConfirmedPayment) return [];
    return sortedPayments.filter(
      (p: Payment) =>
        new Date(p.createdAt).getTime() >
        new Date(advanceConfirmedPayment.createdAt).getTime()
    );
  }, [advanceConfirmedPayment, requiresAdvancePayment, sortedPayments]);

  const singlePayments = requiresAdvancePayment ? [] : sortedPayments;

  const advancePaymentIds = useMemo(
    () => new Set(advancePayments.map((p: Payment) => p.id)),
    [advancePayments]
  );
  const remainingPaymentIds = useMemo(
    () => new Set(remainingPayments.map((p: Payment) => p.id)),
    [remainingPayments]
  );

  const hasBlockingPayments = useMemo(
    () =>
      (paymentsOverview ?? []).some((p: Payment) => p.status === PaymentStatus.PENDING),
    [paymentsOverview]
  );

  const hasPendingPayments = useMemo(
    () =>
      (paymentsOverview ?? []).some((p: Payment) => p.status === PaymentStatus.PENDING),
    [paymentsOverview]
  );

  const hasCreatedPayments = useMemo(
    () =>
      (paymentsOverview ?? []).some(
        (p: Payment) =>
          p.status === PaymentStatus.CREATED &&
          p.method === PaymentMethod.GATEWAY
      ),
    [paymentsOverview]
  );

  const isUploadBlocked = isPaymentsOverviewPending || hasBlockingPayments;

  const paymentBlockedMessage = hasPendingPayments
    ? 'Tienes un pago pendiente de revisión. Espera la validación para registrar otro pago.'
    : hasCreatedPayments
    ? 'Tienes un pago que no fue procesado, espera a su expiracion (5 minutos) para volver a generar otro pago.'
    : undefined;

  const loadingPaymentsMessage = isPaymentsOverviewPending
    ? 'Cargando pagos disponibles...'
    : undefined;

  const remainingPaymentMessage =
    paymentBlockedMessage ||
    loadingPaymentsMessage ||
    (isBookingCompleted
      ? 'La reserva ya se encuentra completada.'
      : !isAdvanceConfirmed
      ? 'Espera la confirmación del anticipo para habilitar este pago.'
      : undefined);
  const advancePaymentMessage =
    paymentBlockedMessage ||
    loadingPaymentsMessage ||
    (isBookingCompleted
      ? 'La reserva ya se encuentra completada.'
      : isAdvanceConfirmed
      ? 'Anticipo confirmado. Ya puedes subir el pago restante.'
      : undefined);

  if (!mounted) return null;

  return (
    <div className="flex flex-column gap-3">
      <Toast ref={toast} />

      <div className="card flex flex-column md:flex-row justify-content-between align-items-start gap-3">
        <div>
          <h2 className="m-0 text-900">Panel de pagos</h2>
          <p className="mt-2 mb-0 text-600">Reserva #{bookingId}</p>
        </div>
        <Button
          label="Volver a reservas"
          icon="pi pi-arrow-left"
          outlined
          onClick={() => router.push('/bookings')}
        />
      </div>

      {user?.role === 'CLIENT' && (
        <div className="flex flex-column gap-3">
          {bookingQuery.isPending && (
            <p className="text-600">Cargando detalle del pago...</p>
          )}

          {bookingQuery.isError && (
            <Message
              severity="error"
              text={getApiErrorMessage(
                bookingQuery.error,
                'No se pudo cargar la reserva.'
              )}
              className="w-full justify-content-start mb-4"
            />
          )}

          {booking &&
            (requiresAdvancePayment ? (
              <>
                <PaymentPanel
                  toast={toast}
                  bookingId={bookingId}
                  title="Pago del anticipo"
                  icon="pi pi-percentage"
                  description={`Esta reserva requiere ${booking.advancePaymentPercentage}% de anticipo.`}
                  details={[
                    {
                      label: 'Total de la reserva',
                      value: formatMoney(totalAmount)
                    },
                    {
                      label: 'Monto del anticipo',
                      value: formatMoney(advancePaymentAmount)
                    }
                  ]}
                  payments={advancePayments}
                  historyTitle="Historial del anticipo"
                  paymentItemTitle="Pago del anticipo"
                  role={user.role}
                  showHistoryHeader={false}
                  showTitleStatus={true}
                  disabled={
                    isUploadBlocked || isAdvanceConfirmed || isBookingCompleted
                  }
                  disabledMessage={advancePaymentMessage}
                  onPayphonePayment={handlePayphonePayment}
                  isGatewayPaymentAllowed={booking.isGatewayPaymentAllowed}
                  bankInfo={booking}
                />

                <PaymentPanel
                  toast={toast}
                  bookingId={bookingId}
                  title="Pago restante"
                  icon="pi pi-check-circle"
                  description="Disponible después de confirmar el anticipo."
                  details={[
                    {
                      label: 'Total de la reserva',
                      value: formatMoney(totalAmount)
                    },
                    {
                      label: 'Saldo restante',
                      value: formatMoney(remainingAmount)
                    }
                  ]}
                  payments={remainingPayments}
                  historyTitle="Historial del pago restante"
                  paymentItemTitle="Pago restante"
                  role={user.role}
                  showHistoryHeader={false}
                  showTitleStatus={true}
                  disabled={
                    isUploadBlocked || !isAdvanceConfirmed || isBookingCompleted
                  }
                  disabledMessage={remainingPaymentMessage}
                  onPayphonePayment={handlePayphonePayment}
                  isGatewayPaymentAllowed={booking.isGatewayPaymentAllowed}
                  bankInfo={booking}
                />
              </>
            ) : (
              <PaymentPanel
                toast={toast}
                bookingId={bookingId}
                title="Pago de la reserva"
                icon="pi pi-wallet"
                description="Selecciona tu método preferido para completar la reserva."
                details={[
                  { label: 'Total a pagar', value: formatMoney(totalAmount) }
                ]}
                payments={singlePayments}
                historyTitle="Historial de pagos"
                paymentItemTitle="Pago de la reserva"
                role={user.role}
                showHistoryHeader={false}
                showTitleStatus={true}
                disabled={isUploadBlocked || isBookingCompleted}
                disabledMessage={
                  paymentBlockedMessage ||
                  loadingPaymentsMessage ||
                  (isBookingCompleted
                    ? 'La reserva ya se encuentra completada.'
                    : undefined)
                }
                onPayphonePayment={handlePayphonePayment}
                isGatewayPaymentAllowed={booking.isGatewayPaymentAllowed}
                bankInfo={booking}
              />
            ))}
        </div>
      )}

      {user?.role && user.role !== 'CLIENT' && (
        <PaymentPanel
          toast={toast}
          title="Listado de pagos"
          icon="pi pi-list"
          payments={sortedPayments}
          getPaymentItemTitle={(payment) => {
            if (!requiresAdvancePayment) return 'Pago de la reserva';
            if (remainingPaymentIds.has(payment.id)) return 'Pago restante';
            if (advancePaymentIds.has(payment.id)) return 'Pago del anticipo';
            return 'Pago';
          }}
          role={user.role}
          allowUpload={false}
          isGatewayPaymentAllowed={true}
          showHistoryHeader={false}
          headerMeta={`${sortedPayments.length} registros`}
          emptyMessage="No hay pagos registrados para esta reserva."
        />
      )}

      <PayPhoneModal
        open={isPayphoneModalOpen}
        payment={paymentDetails}
        onClose={closePayphoneModal}
      />
    </div>
  );
}
