import type { PaymentMethod } from "../enums/PaymentMethod";
import type { PaymentStatus } from "../enums/PaymentStatus";

export class Payment {
  id: number;
  bookingId: number;
  method: PaymentMethod;
  status: PaymentStatus;
  receiptUrl: string;
  transactionReference: string;
  rejectionReason: string;
  verifiedAt: Date;
  createdAt: Date;

  constructor(init: {
    id: number;
    bookingId: number;
    method: PaymentMethod;
    status: PaymentStatus;
    receiptUrl: string;
    transactionReference: string;
    rejectionReason: string;
    verifiedAt: Date;
    createdAt: Date;
  }) {
    this.id = init.id;
    this.bookingId = init.bookingId;
    this.method = init.method;
    this.status = init.status;
    this.receiptUrl = init.receiptUrl;
    this.transactionReference = init.transactionReference;
    this.rejectionReason = init.rejectionReason;
    this.verifiedAt = init.verifiedAt;
    this.createdAt = init.createdAt;
  }
}
