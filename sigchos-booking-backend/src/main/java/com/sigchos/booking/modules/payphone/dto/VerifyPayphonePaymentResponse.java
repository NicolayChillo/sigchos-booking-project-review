package com.sigchos.booking.modules.payphone.dto;

import java.time.LocalDateTime;

public record VerifyPayphonePaymentResponse(
        String email,
        String cardType,
        String bin,
        String lastDigits,
        String deferredCode,
        Boolean deferred,
        String cardBrandCode,
        String cardBrand,
        Long amount,
        String clientTransactionId,
        String phoneNumber,
        Long statusCode,
        String transactionStatus,
        String authorizationCode,
        String message,
        Long messageCode,
        Long transactionId,
        String document,
        String currency,
        String storeName,
        LocalDateTime date,
        String regionIso,
        String transactionType,
        String reference) {

}
