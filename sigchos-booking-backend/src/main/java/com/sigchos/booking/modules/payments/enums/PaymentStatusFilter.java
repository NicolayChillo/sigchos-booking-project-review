package com.sigchos.booking.modules.payments.enums;

import java.util.Optional;

public enum PaymentStatusFilter {
    PENDING(PaymentStatus.PENDING),
    APPROVED(PaymentStatus.APPROVED),
    REJECTED(PaymentStatus.REJECTED),
    ALL(null);

    private final PaymentStatus correspondingStatus;

    PaymentStatusFilter(PaymentStatus status) {
        this.correspondingStatus = status;
    }

    public Optional<PaymentStatus> toPaymentStatus() {
        return Optional.ofNullable(correspondingStatus);
    }
}
