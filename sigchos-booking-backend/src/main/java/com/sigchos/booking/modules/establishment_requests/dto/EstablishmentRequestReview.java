package com.sigchos.booking.modules.establishment_requests.dto;

import com.sigchos.booking.modules.establishment_requests.enums.EstablishmentRequestStatus;
import com.sigchos.booking.validations.EnumSubset;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record EstablishmentRequestReview(
        @EnumSubset(anyOf = {
                "APPROVED",
                "REJECTED" }, message = "Invalid establishment request status") EstablishmentRequestStatus status,
        @Pattern(regexp = "^[\\p{L}\s0-9.,]+$") @Size(min = 3, max = 100) String reviewNote) {

}
