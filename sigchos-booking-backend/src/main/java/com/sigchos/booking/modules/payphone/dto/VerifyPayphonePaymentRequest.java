package com.sigchos.booking.modules.payphone.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record VerifyPayphonePaymentRequest(
        @NotNull Long id,
        @NotBlank String clientTxId) {

}
