import { useQuery } from "@tanstack/react-query";
import { PaymentStatusFilter } from "../enums/PaymentStatusFilter";
import { PaymentService } from "../services/payment.service";

export function usePaymentsByBookingIdList({
  bookingId,
  status = PaymentStatusFilter.PENDING,
}: {
  bookingId: number | undefined;
  status?: PaymentStatusFilter;
}) {
  const { data, isPending, error } = useQuery({
    queryKey: ["payments", bookingId, status],
    queryFn: async () => {
      if (!bookingId) return;
      return await PaymentService.findByBookingId(bookingId, status);
    },
    enabled: !!bookingId,
    refetchOnWindowFocus: false,
  });

  return {
    data,
    isPending,
    error,
  };
}
