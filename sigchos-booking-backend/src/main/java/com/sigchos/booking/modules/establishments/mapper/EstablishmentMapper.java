package com.sigchos.booking.modules.establishments.mapper;

import java.util.Collections;
import java.util.List;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sigchos.booking.modules.establishment_images.dto.EstablishmentImageResponse;
import com.sigchos.booking.modules.establishments.dto.EstablishmentRequest;
import com.sigchos.booking.modules.establishments.dto.EstablishmentResponse;
import com.sigchos.booking.modules.establishments.model.Establishment;
import com.sigchos.booking.modules.user.model.User;

public class EstablishmentMapper {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private static List<String> deserializeOtherPolicies(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return OBJECT_MAPPER.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    public static EstablishmentResponse toResponse(Establishment entity, List<EstablishmentImageResponse> images) {
        return new EstablishmentResponse(
                entity.getId(),
                entity.getUser().getId(),
                entity.getName(),
                entity.getDescription(),
                entity.getAddress(),
                entity.getCheckInTime(),
                entity.getCheckOutTime(),
                entity.getAdvancePaymentPolicy(),
                entity.getCancellationPolicy(),
                entity.getCancelPenaltyWindowHours(),
                entity.isCancelPenaltyAfterEnabled(),
                entity.getCancelPenaltyAfterPercentage(),
                entity.getChildrenPolicy(),
                entity.getAgeRestrictionPolicy(),
                entity.getPetsPolicy(),
                deserializeOtherPolicies(entity.getOtherPolicies()),
                entity.getParish(),
                entity.getLatitude(),
                entity.getLongitude(),
                entity.isActive(),
                entity.getPayphoneToken(),
                entity.getPayphoneStoreId(),
                entity.hasGatewayAvailable(),
                entity.getBankName(),
                entity.getBankAccountType(),
                entity.getBankAccountNumber(),
                entity.getBankAccountOwnerName(),
                entity.getBankAccountOwnerId(),
                images);
    }

    public static Establishment toEntity(EstablishmentRequest dto, User user) {
        return Establishment.builder()
                .user(user)
                .name(dto.name())
                .description(dto.description())
                .address(dto.address())
                .checkInTime(dto.checkInTime())
                .checkOutTime(dto.checkOutTime())
                .advancePaymentPolicy(dto.advancePaymentPolicy())
                .cancellationPolicy(dto.cancellationPolicy())
                .cancelPenaltyWindowHours(dto.cancelPenaltyWindowHours())
                .cancelPenaltyAfterEnabled(Boolean.TRUE.equals(dto.cancelPenaltyAfterEnabled()))
                .cancelPenaltyAfterPercentage(dto.cancelPenaltyAfterPercentage())
                .childrenPolicy(dto.childrenPolicy())
                .ageRestrictionPolicy(dto.ageRestrictionPolicy())
                .petsPolicy(dto.petsPolicy())
                .parish(dto.parish())
                .latitude(dto.latitude())
                .longitude(dto.longitude())
                .build();
    }
}
