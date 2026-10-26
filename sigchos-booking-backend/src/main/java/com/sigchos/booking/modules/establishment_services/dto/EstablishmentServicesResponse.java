package com.sigchos.booking.modules.establishment_services.dto;

import java.math.BigDecimal;

import com.sigchos.booking.modules.establishment_services.model.ServiceCategory;

public record EstablishmentServicesResponse(
        Long id,
        Long establishmentId,
        ServiceCategory category,
        String name,
        String description,
        boolean hasAdditionalCost,
        BigDecimal additionalCost,
        boolean isActive) {

}
