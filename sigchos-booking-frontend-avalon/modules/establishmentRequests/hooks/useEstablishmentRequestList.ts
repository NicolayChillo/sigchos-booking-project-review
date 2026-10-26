import { useQuery } from "@tanstack/react-query";
import { EstablishmentRequestStatusFilter } from "../enum/EstablishmentRequestStatusFilter";
import { EstablishmentRequestService } from "../services/EstablishmentRequest.service";

export function useEstablishmentRequestList({
  filter = EstablishmentRequestStatusFilter.PENDING,
}: { filter?: EstablishmentRequestStatusFilter } = {}) {
  const { data, isPending, error } = useQuery({
    queryKey: ["establishment-requests", filter],
    queryFn: () => EstablishmentRequestService.findAll(filter),
    refetchOnWindowFocus: false,
  });

  return {
    data,
    isPending,
    error,
  };
}
