package com.sigchos.booking.modules.establishments.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Builder;

@Builder
public record EstablishmentRequest(
        @NotBlank @Size(min = 3, max = 100) @Pattern(regexp = "^(?U)[\\p{L}0-9\\s\"'\\-.]+$") String name,
        @NotBlank @Size(min = 3, max = 255) @Pattern(regexp = "^[\\p{L}0-9\\s\"().,:;/\\-+]+$") String description,
        @NotBlank @Size(min = 3, max = 255) @Pattern(regexp = "^[\\p{L}0-9\\s\"().,:;/\\-+]+$") String address,
        @NotBlank @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$") String checkInTime,
        @NotBlank @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$") String checkOutTime,
        @NotBlank @Size(min = 3, max = 500) @Pattern(regexp = "^[\\p{L}0-9\\s\"().,:;/\\-]+$") String advancePaymentPolicy,
        @NotBlank @Size(min = 3, max = 500) String cancellationPolicy,
        Integer cancelPenaltyWindowHours,
        @NotNull Boolean cancelPenaltyAfterEnabled,
        Integer cancelPenaltyAfterPercentage,
        @NotBlank @Size(min = 3, max = 500) @Pattern(regexp = "^[\\p{L}0-9\\s\"().,:;/\\-]+$") String childrenPolicy,
        @NotBlank @Size(min = 3, max = 255) @Pattern(regexp = "^[\\p{L}0-9\\s\"().,:;/\\-]+$") String ageRestrictionPolicy,
        @NotBlank @Size(min = 3, max = 500) @Pattern(regexp = "^[\\p{L}0-9\\s\"().,:;/\\-]+$") String petsPolicy,
        String parish,
        Double latitude,
        Double longitude) {

}
