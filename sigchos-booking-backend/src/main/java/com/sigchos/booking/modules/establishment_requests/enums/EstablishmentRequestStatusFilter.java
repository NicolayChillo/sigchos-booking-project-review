package com.sigchos.booking.modules.establishment_requests.enums;

import java.util.Optional;

public enum EstablishmentRequestStatusFilter {
    ALL(null),
    PENDING(EstablishmentRequestStatus.PENDING),
    APPROVED(EstablishmentRequestStatus.APPROVED),
    REJECTED(EstablishmentRequestStatus.REJECTED);

    private final EstablishmentRequestStatus value;

    EstablishmentRequestStatusFilter(EstablishmentRequestStatus status) {
        value = status;
    }

    public Optional<EstablishmentRequestStatus> toEstablishmentRequestStatus() {
        return Optional.ofNullable(value);
    }
}
