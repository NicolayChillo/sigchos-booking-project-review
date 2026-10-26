package com.sigchos.booking.modules.room_types.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

import com.sigchos.booking.modules.room_type_images.dto.RoomTypeImageResponse;
import com.sigchos.booking.modules.room_types.enums.RoomAmenity;
import com.sigchos.booking.modules.room_types.enums.RoomBedType;
import com.sigchos.booking.modules.room_types.enums.RoomCategory;

public record RoomTypePublicResponse(
        Long id,
        Long establishmentId,
        String name,
        String description,
        RoomCategory category,
        Integer capacity,
        Integer bedCount,
        RoomBedType bedType,
        Set<RoomAmenity> amenities,
        BigDecimal pricePerNight,
        boolean requiresAdvancePayment,
        Integer advancePaymentPercentage,
        boolean hasVacancy,
        List<RoomTypeImageResponse> images) {

}