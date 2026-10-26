export const EstablishmentRequestStatus = {
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  PENDING: "PENDING",
} as const;

export type EstablishmentRequestStatus =
  (typeof EstablishmentRequestStatus)[keyof typeof EstablishmentRequestStatus];

export const EstablishmentRequestStatusLabel: Record<
  EstablishmentRequestStatus,
  string
> = {
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
  PENDING: "Pendiente",
} as const;
