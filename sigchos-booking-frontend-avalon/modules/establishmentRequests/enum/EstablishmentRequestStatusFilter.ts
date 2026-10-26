export const EstablishmentRequestStatusFilter = {
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  PENDING: "PENDING",
  ALL: "ALL",
} as const;

export type EstablishmentRequestStatusFilter =
  (typeof EstablishmentRequestStatusFilter)[keyof typeof EstablishmentRequestStatusFilter];

export const EstablishmentRequestStatusFilterLabel: Record<
  EstablishmentRequestStatusFilter,
  string
> = {
  ALL: "Todos",
  APPROVED: "Aprobado",
  PENDING: "Pendiente",
  REJECTED: "Rechazado",
};
