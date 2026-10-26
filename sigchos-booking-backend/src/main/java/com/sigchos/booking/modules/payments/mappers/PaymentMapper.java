package com.sigchos.booking.modules.payments.mappers;

import com.sigchos.booking.modules.bookings.model.Booking;
import com.sigchos.booking.modules.payments.dto.BankTransferPaymentRequest;
import com.sigchos.booking.modules.payments.dto.PaymentResponse;
import com.sigchos.booking.modules.payments.enums.PaymentMethod;
import com.sigchos.booking.modules.payments.enums.PaymentStatus;
import com.sigchos.booking.modules.payments.models.Payment;

public class PaymentMapper {
    public static Payment toEntity(BankTransferPaymentRequest dto, Booking booking, String receiptUrl) {
        return Payment.builder()
                .booking(booking)
                .method(PaymentMethod.BANK_TRANSFER)
                .status(PaymentStatus.PENDING)
                .receiptUrl(receiptUrl)
                .build();
    }

    public static PaymentResponse toResponse(Payment entity, String signedReceiptUrl) {
        return new PaymentResponse(
                entity.getId(),
                entity.getBooking().getId(),
                entity.getMethod(),
                entity.getStatus(),
                signedReceiptUrl,
                entity.getTransactionReference(),
                entity.getRejectionReason(),
                entity.getVerifiedAt(),
                entity.getCreatedAt());
    }

    public static PaymentResponse toResponse(Payment entity) {
        return new PaymentResponse(
                entity.getId(),
                entity.getBooking().getId(),
                entity.getMethod(),
                entity.getStatus(),
                null,
                entity.getTransactionReference(),
                entity.getRejectionReason(),
                entity.getVerifiedAt(),
                entity.getCreatedAt());
    }
}
