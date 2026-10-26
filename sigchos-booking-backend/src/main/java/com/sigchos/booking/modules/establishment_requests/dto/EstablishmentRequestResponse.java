package com.sigchos.booking.modules.establishment_requests.dto;

import java.time.LocalDateTime;

import com.sigchos.booking.modules.establishment_requests.enums.EstablishmentRequestStatus;
import com.sigchos.booking.modules.user.dto.UserSummary;

public record EstablishmentRequestResponse(
        Long id,
        UserSummary requestedBy,
        String name,
        String address,
        String certificateUrl,
        EstablishmentRequestStatus status,
        String reviewNote,
        LocalDateTime createdAt,
        LocalDateTime reviewedAt,
        UserSummary reviewedBy) {

}
