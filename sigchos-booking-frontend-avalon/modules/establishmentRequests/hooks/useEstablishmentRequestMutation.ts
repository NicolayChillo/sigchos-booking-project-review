import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EstablishmentRequestService } from "../services/EstablishmentRequest.service";
import type {
  EstablishmentRequestCreate,
  EstablishmentRequestReview,
} from "../dto/EstablishmentRequest";

export function useEstablishmentRequestMutation() {
  const queryClient = useQueryClient();

  const {
    mutateAsync: create,
    error: createError,
    isPending: isCreatePending,
  } = useMutation({
    mutationFn: (dto: EstablishmentRequestCreate) =>
      EstablishmentRequestService.create(dto),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["establishment-requests"] }),
  });

  const {
    mutateAsync: review,
    error: reviewError,
    isPending: isReviewPending,
  } = useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: number;
      dto: EstablishmentRequestReview;
    }) => EstablishmentRequestService.review(id, dto),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["establishment-requests"],
      }),
  });

  return {
    create,
    review,
    mutationError: createError || reviewError,
    isMutationPending: isCreatePending || isReviewPending,
  };
}
