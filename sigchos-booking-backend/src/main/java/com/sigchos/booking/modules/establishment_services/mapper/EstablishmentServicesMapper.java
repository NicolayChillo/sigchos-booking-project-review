package com.sigchos.booking.modules.establishment_services.mapper;

import java.math.BigDecimal;

import com.sigchos.booking.modules.establishments.model.Establishment;
import com.sigchos.booking.modules.establishment_services.dto.EstablishmentServicesRequest;
import com.sigchos.booking.modules.establishment_services.dto.EstablishmentServicesResponse;
import com.sigchos.booking.modules.establishment_services.model.EstablishmentServices;

public class EstablishmentServicesMapper {
    public static EstablishmentServicesResponse toResponse(EstablishmentServices entity) {
        return new EstablishmentServicesResponse(
                entity.getId(),
                entity.getEstablishment().getId(),
                entity.getCategory(),
                entity.getName(),
                entity.getDescription(),
                Boolean.TRUE.equals(entity.getHasAdditionalCost()),
                entity.getAdditionalCost(),
                entity.isActive());
    }

    public static EstablishmentServices toEntity(EstablishmentServicesRequest dto, Establishment establishment) {
        return EstablishmentServices.builder()
                .establishment(establishment)
                .category(dto.category())
                .name(dto.name())
                .description(dto.description())
                .hasAdditionalCost(Boolean.TRUE.equals(dto.hasAdditionalCost()))
                .additionalCost(dto.additionalCost() == null ? BigDecimal.ZERO : dto.additionalCost())
                .build();
    }
}
