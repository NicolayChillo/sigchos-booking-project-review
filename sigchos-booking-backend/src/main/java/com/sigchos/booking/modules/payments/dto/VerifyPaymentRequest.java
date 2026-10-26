package com.sigchos.booking.modules.payments.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record VerifyPaymentRequest(
                @NotNull Long transactionId,
                @NotBlank String clientTransactionId) {

}
