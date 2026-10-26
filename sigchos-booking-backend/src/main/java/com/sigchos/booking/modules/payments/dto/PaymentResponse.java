package com.sigchos.booking.modules.payments.dto;

import java.time.LocalDateTime;

import com.sigchos.booking.modules.payments.enums.PaymentMethod;
import com.sigchos.booking.modules.payments.enums.PaymentStatus;

public record PaymentResponse(
        Long id,
        Long bookingId,
        PaymentMethod method,
        PaymentStatus status,
        String receiptUrl,
        String transactionReference,
        String rejectionReason,
        LocalDateTime verifiedAt,
        LocalDateTime createdAt) {

}
