import {
  useMutation,
  useMutationState,
  useQueryClient
} from '@tanstack/react-query';
import { PaymentService } from '../services/payment.service';
import type { BankTransferPaymentValidationRequest } from '../dto/payment';

export function usePaymentMutation() {
  const queryClient = useQueryClient();

  const {
    mutateAsync: uploadBankTransferReceipt,
    isPending: isUploadBankTransferReceiptPending,
    error: uploadBankTransferReceiptError
  } = useMutation({
    mutationFn: ({ bookingId, file }: { bookingId: number; file: File }) =>
      PaymentService.uploadBankTransferReceipt(bookingId, file),
    onSuccess: async ({ bookingId }) => {
      await queryClient.invalidateQueries({
        queryKey: ['payments', bookingId]
      });
      await queryClient.invalidateQueries({
        queryKey: ['booking', bookingId]
      });
    }
  });

  const {
    mutateAsync: validateBankTransferReceipt,
    isPending: isValidateBankTransferReceiptPending,
    error: validateBankTransferReceiptError
  } = useMutation({
    mutationFn: ({
      id,
      dto
    }: {
      id: number;
      dto: BankTransferPaymentValidationRequest;
    }) => PaymentService.validateBankTransferReceipt(id, dto),
    onSuccess: async ({ bookingId }) => {
      await queryClient.invalidateQueries({
        queryKey: ['payments', bookingId]
      });
      await queryClient.invalidateQueries({
        queryKey: ['booking', bookingId]
      });
    }
  });

  const {
    mutateAsync: createPaymentCheckout,
    isPending: isInitCheckoutPending,
    error: initCheckoutError
  } = useMutation({
    mutationFn: async ({ bookingId }: { bookingId: number }) =>
      PaymentService.createPaymentCheckout(bookingId)
  });

  return {
    uploadBankTransferReceipt,
    validateBankTransferReceipt,
    createPaymentCheckout,
    isMutationPending:
      isUploadBankTransferReceiptPending ||
      isValidateBankTransferReceiptPending ||
      isInitCheckoutPending,
    mutationError:
      uploadBankTransferReceiptError ||
      validateBankTransferReceiptError ||
      initCheckoutError
  };
}
