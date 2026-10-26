export const PaymentStatusFilter = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  ALL: "ALL",
} as const;

export type PaymentStatusFilter =
  (typeof PaymentStatusFilter)[keyof typeof PaymentStatusFilter];

export const PaymentStatusFilterLabel: Record<PaymentStatusFilter, string> = {
  APPROVED: "Aprobado",
  PENDING: "Pendiente",
  REJECTED: "Rechazado",
  ALL: "Todos",
} as const;
