import type { PaymentResponse } from "../dto/payment";
import { Payment } from "../models/payment";

export class PaymentMapper {
  static toEntity(dto: PaymentResponse) {
    return new Payment({
      id: dto.id,
      bookingId: dto.bookingId,
      method: dto.method,
      status: dto.status,
      receiptUrl: dto.receiptUrl ?? '',
      transactionReference: dto.transactionReference ?? '',
      rejectionReason: dto.rejectionReason ?? '',
      verifiedAt: new Date(dto.verifiedAt),
      createdAt: new Date(dto.createdAt),
    });
  }
}
