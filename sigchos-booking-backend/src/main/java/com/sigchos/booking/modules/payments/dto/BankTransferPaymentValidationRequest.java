package com.sigchos.booking.modules.payments.dto;

import com.sigchos.booking.modules.payments.enums.PaymentStatus;
import com.sigchos.booking.validations.EnumSubset;

import jakarta.validation.constraints.NotNull;

public record BankTransferPaymentValidationRequest(
        @NotNull @EnumSubset(anyOf = {
                "APPROVED",
                "REJECTED" }, message = "Invalid payment status value") PaymentStatus status,
        String rejectionReason) {
}
