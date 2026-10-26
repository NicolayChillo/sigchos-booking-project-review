package com.sigchos.booking.modules.establishment_services.dto;

import java.math.BigDecimal;

import com.sigchos.booking.modules.establishment_services.model.ServiceCategory;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record EstablishmentServicesRequest(
        @NotNull Long establishmentId,
        @NotNull ServiceCategory category,
        @NotBlank @Size(min = 3, max = 50) @Pattern(regexp = "^[\\p{L}0-9\\s\"().,:;/'\\-]+$") String name,
        @NotBlank @Size(min = 3, max = 255) @Pattern(regexp = "^[\\p{L}0-9\\s\"().,:;/'\\-]+$") String description,
        @NotNull Boolean hasAdditionalCost,
        @DecimalMin(value = "0.0", inclusive = true) @Digits(integer = 8, fraction = 2) BigDecimal additionalCost) {

}
