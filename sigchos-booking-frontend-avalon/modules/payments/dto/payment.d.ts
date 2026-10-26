import type { PaymentMethod } from '../enums/PaymentMethod';
import type { PaymentStatus } from '../enums/PaymentStatus';

export interface BankTransferPaymentValidationRequest {
  status: PaymentStatus;
  rejectionReason: string | null;
}

export interface PaymentResponse {
  id: number;
  bookingId: number;
  method: PaymentMethod;
  status: PaymentStatus;
  receiptUrl: string | null;
  transactionReference: string;
  rejectionReason: string;
  verifiedAt: string;
  createdAt: string;
}

export interface PaymentCheckoutResponse {
  token: string;
  transactionId: string;
  amount: number;
  amountWithoutTax: number;
  currency: string;
  storeId: string;
  reference: string;
}

export interface VerifyPaymentRequest {
  transactionId: number;
  clientTransactionId: string;
}
