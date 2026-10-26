package com.sigchos.booking.modules.payments.dto;

public record PaymentCheckoutResponse(
        String token,
        String transactionId,
        Long amount,
        Long amountWithoutTax,
        String currency,
        String storeId,
        String reference) {
}