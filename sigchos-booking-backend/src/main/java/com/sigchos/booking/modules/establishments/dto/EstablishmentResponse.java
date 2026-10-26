package com.sigchos.booking.modules.establishments.dto;

import java.util.List;

import com.sigchos.booking.modules.establishment_images.dto.EstablishmentImageResponse;

public record EstablishmentResponse(
        Long id,
        Long userId,
        String name,
        String description,
        String address,
        String checkInTime,
        String checkOutTime,
        String advancePaymentPolicy,
        String cancellationPolicy,
        Integer cancelPenaltyWindowHours,
        boolean cancelPenaltyAfterEnabled,
        Integer cancelPenaltyAfterPercentage,
        String childrenPolicy,
        String ageRestrictionPolicy,
        String petsPolicy,
        List<String> otherPolicies,
        String parish,
        Double latitude,
        Double longitude,
        boolean isActive,
        String payphoneToken,
        String payphoneStoreId,
        boolean hasGatewayAvailable,
        String bankName,
        String bankAccountType,
        String bankAccountNumber,
        String bankAccountOwnerName,
        String bankAccountOwnerId,
        List<EstablishmentImageResponse> images) {

}
