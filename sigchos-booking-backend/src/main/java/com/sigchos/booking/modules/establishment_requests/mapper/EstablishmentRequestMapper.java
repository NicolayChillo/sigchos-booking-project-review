package com.sigchos.booking.modules.establishment_requests.mapper;

import com.sigchos.booking.modules.establishment_requests.dto.EstablishmentRequestResponse;
import com.sigchos.booking.modules.establishment_requests.model.EstablishmentRequest;
import com.sigchos.booking.modules.user.dto.UserSummary;
import com.sigchos.booking.modules.user.mapper.UserMapper;

public class EstablishmentRequestMapper {
    public static EstablishmentRequestResponse toResponse(EstablishmentRequest entity, String certificateUrl) {
        UserSummary requestedBy = UserMapper.toSummary(entity.getRequestedBy());
        UserSummary reviewedBy = entity.getReviewedBy() == null ? null : UserMapper.toSummary(entity.getReviewedBy());

        return new EstablishmentRequestResponse(
                entity.getId(),
                requestedBy,
                entity.getName(),
                entity.getAddress(),
                certificateUrl,
                entity.getStatus(),
                entity.getReviewNote(),
                entity.getCreatedAt(),
                entity.getReviewedAt(),
                reviewedBy);
    }

    public static com.sigchos.booking.modules.establishments.dto.EstablishmentRequest toEstablishmentRequest(
            EstablishmentRequest entity) {
        return com.sigchos.booking.modules.establishments.dto.EstablishmentRequest.builder()
                .name(entity.getName())
                .address(entity.getAddress())
                .build();
    }
}
