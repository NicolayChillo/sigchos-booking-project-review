import { useQuery } from '@tanstack/react-query';
import { PaymentService } from '../services/payment.service';

interface Params {
  transactionId: number | null;
  clientTransactionId: string | null;
}

export function useProcessPaymentCheckout({
  transactionId,
  clientTransactionId
}: Params) {
  const { data, error, isPending } = useQuery({
    queryFn: async () => {
      if (transactionId == null || !clientTransactionId) return;

      return PaymentService.processPaymentCheckout({
        transactionId: transactionId,
        clientTransactionId
      });
    },
    queryKey: ['payments', transactionId, clientTransactionId],
    enabled: transactionId != null && clientTransactionId != null,
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: 1000 * 60
  });

  return {
    data,
    error,
    isPending
  };
}
