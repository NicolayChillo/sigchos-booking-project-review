import { apiClient } from '@/lib/http/apiClient';
import type {
  BankTransferPaymentValidationRequest,
  PaymentCheckoutResponse,
  PaymentResponse,
  VerifyPaymentRequest
} from '../dto/payment';
import type { PaymentStatusFilter } from '../enums/PaymentStatusFilter';

export const PaymentApi = {
  findByBookingId(bookingId: number, filter: PaymentStatusFilter) {
    return apiClient.get<PaymentResponse[]>(`/payments/bookings/${bookingId}`, {
      params: {
        filter
      }
    });
  },

  uploadBankTransferReceipt(bookingId: number, file: File) {
    const formData = new FormData();

    formData.append('receiptFile', file);

    return apiClient.post<PaymentResponse>(
      `/payments/bookings/${bookingId}/transfer`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
  },

  validateBankTransferReceipt(
    id: number,
    dto: BankTransferPaymentValidationRequest
  ) {
    return apiClient.patch<PaymentResponse>(`/payments/${id}/validate`, dto);
  },

  createPaymentCheckout(bookingId: number) {
    return apiClient.post<PaymentCheckoutResponse>(
      `/payments/bookings/${bookingId}/checkout`
    );
  },

  processPaymentCheckout(dto: VerifyPaymentRequest) {
    return apiClient.post<PaymentResponse>(`/payments/checkout/process`, dto);
  }
};
