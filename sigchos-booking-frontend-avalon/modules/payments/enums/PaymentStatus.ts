export const PaymentStatus = {
  CREATED: 'CREATED',
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED'
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const PaymentStatusLabel: Record<PaymentStatus, string> = {
  CREATED: 'Creado',
  APPROVED: 'Aprobado',
  PENDING: 'Pendiente',
  REJECTED: 'Rechazado',
  CANCELLED: 'Cancelado'
} as const;
