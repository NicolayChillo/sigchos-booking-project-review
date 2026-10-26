package com.sigchos.booking.modules.payments.dto;

import org.springframework.web.multipart.MultipartFile;

import com.sigchos.booking.validations.File;

import jakarta.validation.constraints.NotNull;

public record BankTransferPaymentRequest(
        @NotNull @File(contentTypes = {
                "image/jpeg", "image/webp",
                "image/png" }, message = "File must be a JPG, PNG or WebP", maxSizeInMB = 5) MultipartFile receiptFile) {
}
