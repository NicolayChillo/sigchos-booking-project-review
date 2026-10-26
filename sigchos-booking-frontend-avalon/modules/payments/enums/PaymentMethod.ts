export const PaymentMethod = {
  BANK_TRANSFER: "BANK_TRANSFER",
  GATEWAY: "GATEWAY",
} as const;

export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const PaymentMethodLabel: Record<PaymentMethod, string> = {
  BANK_TRANSFER: "Transferencia bancaria",
  GATEWAY: "Tarjeta de credito",
};
